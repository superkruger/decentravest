import Web3 from 'web3'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import TraderPaired from '../abis/TraderPaired.json'
import PairedInvestments from '../abis/PairedInvestments.json'
import MultiSigFundWalletFactory from '../abis/MultiSigFundWalletFactory.json'
import MultiSigFundWallet from '../abis/MultiSigFundWallet.json'
import ERC20 from '../abis/IERC20.json'
import { ZERO_ADDRESS, etherToWei, addressForAsset } from '../helpers'
import { getTraderPositions } from './dydxInteractions'
import { 
	web3Loaded,
	web3AccountLoaded,
	traderPairedLoaded,
	pairedInvestmentsLoaded,
	tokensLoaded,
	balanceLoaded,
	traderLoaded,
	mainTraderLoaded,
	investorLoaded,
	mainInvestorLoaded,
	traderJoining,
	investorJoining,
	pageSelected,
	traderAllocationsLoaded,
	walletFactoryLoaded,
	walletCreating,
	mainWalletLoaded,
	investmentLoaded,
	investmentChanging,
	disbursementCreated
} from './actions.js'
import { 
  loadAllTraderPositions
} from './dydxInteractions'

export const loadWeb3 = async (dispatch) => {

	let web3
	if (window.ethereum) {
		web3 = new Web3(window.ethereum)
		await window.ethereum.enable()

		window.ethereum.on('accountsChanged', async function (accounts) {
		    // await loadWebApp(web3, dispatch)
		    document.location.reload()
		  })

		  window.ethereum.on('chainChanged', () => {
		    document.location.reload()
		  })

		  window.ethereum.on('networkChanged', () => {
		    document.location.reload()
		  })
	} else if (window.web3) {
		web3 = new Web3(window.web3.currentProvider || 'http://127.0.0.1:8545')
	}
	else {
		console.log('nothing')
		// Do nothing....
	}

	if (web3) {
		web3.eth.handleRevert = true
		dispatch(web3Loaded(web3))
	}
	return web3

	// console.log("W3V", Web3)
	// let web3 = new Web3(window['ethereum'] || Web3.givenProvider || 'http://127.0.0.1:8545')
	// web3.eth.handleRevert = true
	// dispatch(web3Loaded(web3))
	// return web3
}

export const loadAccount = async (web3, dispatch) => {
	const accounts = await web3.eth.getAccounts()
	const account = accounts[0]
	dispatch(web3AccountLoaded(account))
	return account
}

export const loadBalances = async (account, traderPaired, tokens, web3, dispatch) => {
	const etherBalance = await web3.eth.getBalance(account)
	dispatch(balanceLoaded({amount: new BigNumber(etherBalance), symbol: "ETH"}))

	tokens.forEach(async (token) => {
		const tokenBalance = await token.contract.methods.balanceOf(account).call()
		dispatch(balanceLoaded({amount: new BigNumber(tokenBalance), symbol: token.symbol}))
	})
}

export const loadTraderPaired = async (account, web3, networkId, dispatch) => {
	try {
		if (TraderPaired.networks[networkId] !== undefined) {
			console.log("TraderPaired address: ", TraderPaired.networks[networkId].address)
			const traderPaired = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})

			const pairedInvestments = await new web3.eth.Contract(PairedInvestments.abi, PairedInvestments.networks[networkId].address, {handleRevert: true})
			dispatch(pairedInvestmentsLoaded(pairedInvestments))

			const walletFactory = await new web3.eth.Contract(MultiSigFundWalletFactory.abi, MultiSigFundWalletFactory.networks[networkId].address, {handleRevert: true})
			dispatch(walletFactoryLoaded(walletFactory))

			const daiToken = await new web3.eth.Contract(ERC20.abi, `${process.env.REACT_APP_DAI_ADDRESS}`, {handleRevert: true})
			const usdcToken = await new web3.eth.Contract(ERC20.abi, `${process.env.REACT_APP_USDC_ADDRESS}`, {handleRevert: true})

			dispatch(tokensLoaded([
			{
				contract: daiToken,
				symbol: "DAI",
				decimals: 18
			},
			{
				contract: usdcToken,
				symbol: "USDC",
				decimals: 6
			}
			]))

			loadTraders(traderPaired, dispatch)
			dispatch(traderPairedLoaded(traderPaired))

			const trader = await traderPaired.methods.traders(account).call()
			console.log('Trader', trader)
			const investor = await traderPaired.methods.investors(account).call()
			console.log('Investor', investor)

			if (trader && trader.user !== ZERO_ADDRESS) {
				await loadMainTrader(trader, web3, traderPaired, dispatch)
			}
			if (investor && investor.user !== ZERO_ADDRESS) {
				await loadMainInvestor(investor, web3, traderPaired, pairedInvestments, walletFactory, dispatch)
			}

			return traderPaired
		}
	} catch (error) {
		console.log('Contract not deployed to the current network', error)
	}
	return null
}

const loadMainTrader = async (trader, web3, traderPaired, dispatch) => {
	await loadTraderInvestments(trader, web3, traderPaired, dispatch)

	dispatch(mainTraderLoaded(trader))
}

const loadMainInvestor = async (investor, web3, traderPaired, pairedInvestments, walletFactory, dispatch) => {
	await loadInvestorInvestments(investor, traderPaired, pairedInvestments, dispatch)
	await loadMainWallet(investor.user, walletFactory, web3, dispatch)
	
	dispatch(mainInvestorLoaded(investor))
}

const loadTraders = async (traderPaired, dispatch) => {
	const stream = await traderPaired.getPastEvents(
		'Trader',
		{
			filter: {},
			fromBlock: 0
		}
	)
	const traders = stream.map(event => event.returnValues)
	console.log('loadTraders', traders)
	traders.forEach(trader => dispatch(traderLoaded(mapTrader(trader))))

	traderPaired.events.Trader({filter: {}}, (error, event) => {
		dispatch(traderLoaded(mapTrader(event.returnValues)))
	})
}

const loadTraderInvestments = async (trader, web3, traderPaired, dispatch) => {
	
	let stream = await traderPaired.getPastEvents(
		'Invest',
		{
			filter: {trader: trader.user},
			fromBlock: 0
		}
	)
	let investments = stream.map(event => event.returnValues)
	investments.forEach(async (investment) => {
		investment.walletContract = await getInvestmentWallet(investment, web3, dispatch)
		dispatch(investmentLoaded(mapInvest(investment)))
		await registerWalletEvents(investment.walletContract, dispatch)
	})

	stream = await traderPaired.getPastEvents(
		'Stop',
		{
			filter: {trader: trader.user},
			fromBlock: 0
		}
	)
	investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapStop(investment))))

	stream = await traderPaired.getPastEvents(
		'RequestExit',
		{
			filter: {trader: trader.user},
			fromBlock: 0
		}
	)
	investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapRequestExit(investment))))

	stream = await traderPaired.getPastEvents(
		'ApproveExit',
		{
			filter: {trader: trader.user},
			fromBlock: 0
		}
	)
	investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapApproveExit(investment))))

	traderPaired.events.Invest({filter: {trader: trader.user}}, (error, event) => {
		dispatch(investmentLoaded(mapInvest(event.returnValues)))
	})

	traderPaired.events.Stop({filter: {trader: trader.user}}, (error, event) => {
		dispatch(investmentLoaded(mapStop(event.returnValues)))
	})

	traderPaired.events.RequestExit({filter: {trader: trader.user}}, (error, event) => {
		dispatch(investmentLoaded(mapRequestExit(event.returnValues)))
	})
	
	traderPaired.events.ApproveExit({filter: {trader: trader.user}}, (error, event) => {
		dispatch(investmentLoaded(mapApproveExit(event.returnValues)))
	})
}

export const joinAsTrader = async (account, traderPaired, web3, dispatch) => {
	try {
		traderPaired.methods.joinAsTrader().send({from: account})
		.on('transactionHash', (hash) => {
			dispatch(traderJoining())
		})
		.on('receipt', async (receipt) => {

			const trader = await traderPaired.methods.traders(account).call()

			if (trader.user !== ZERO_ADDRESS) {
				await loadMainTrader(trader, web3, traderPaired, dispatch)
				dispatch(pageSelected('trader'))
			}
		})
		.on('error', (error) => {
			console.log('Could not joinAsTrader', error)
		})
	} catch (error) {
		console.log('Could not joinAsTrader', error)
		return null
	}
}

export const joinAsInvestor = async (account, web3, traderPaired, pairedInvestments, walletFactory, dispatch) => {
	try {
		traderPaired.methods.joinAsInvestor().send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(investorJoining())
		})
		.on('receipt', async (receipt) => {

			const investor = await traderPaired.methods.investors(account).call()

			if (investor.user !== ZERO_ADDRESS) {
				await loadMainInvestor(investor, web3, traderPaired, pairedInvestments, walletFactory, dispatch)
				dispatch(pageSelected('investor'))
			}
		})
		.on('error', (error) => {
			console.log('Could not joinAsInvestor', error)
		})
	} catch (error) {
		console.log('Could not joinAsInvestor', error)
		return null
	}
}


export const loadTraderAllocations = async (account, traderPaired, dispatch) => {
	try {
		let allocations = await getTraderAllocations(account, traderPaired)

		dispatch(traderAllocationsLoaded(account, allocations))

	} catch (error) {
		console.log('Could not loadTraderAllocations', error)
		return null
	}
}

const getTraderAllocations = async (account, traderPaired) => {
	try {
		let allocations = []
		// ETH
		let tokenAllocation = await traderPaired.methods.allocations(account, ZERO_ADDRESS).call()
		tokenAllocation = mapAllocation(tokenAllocation, "ETH", ZERO_ADDRESS)
		allocations = allocations.concat(tokenAllocation)

		// DAI
		tokenAllocation = await traderPaired.methods.allocations(account, `${process.env.REACT_APP_DAI_ADDRESS}`).call()
		tokenAllocation = mapAllocation(tokenAllocation, "DAI", `${process.env.REACT_APP_DAI_ADDRESS}`)
		allocations = allocations.concat(tokenAllocation)

		// USDC
		tokenAllocation = await traderPaired.methods.allocations(account, `${process.env.REACT_APP_USDC_ADDRESS}`).call()
		tokenAllocation = mapAllocation(tokenAllocation, "USDC", `${process.env.REACT_APP_USDC_ADDRESS}`)
		allocations = allocations.concat(tokenAllocation)

		return allocations

	} catch (error) {
		console.log('Could not getTraderAllocations', error)
		return null
	}
}

const mapAllocation = (allocation, name, address) => {
	
	const mappedAllocation = {
		invested: new BigNumber(allocation.invested),
		total: new BigNumber(allocation.total),
		name: name,
		address: address
	}

	return mappedAllocation
}

export const setTraderAllocation = async (account, tokenAddress, amount, decimals, traderPaired, dispatch) => {
	try {

		traderPaired.methods.allocate(tokenAddress, etherToWei(amount, decimals)).send({from: account})
		.on('transactionHash', async (hash) => {
			
		})
		.on('receipt', async (receipt) => {
			loadTraderAllocations(account, traderPaired, dispatch)
		})
		.on('error', (error) => {
			console.log('Could not setTraderAllocation', error)
		})
	} catch (error) {
		console.log('Could not setTraderAllocation', error)
		return null
	}
}

export const createWallet = async (account, traderPaired, walletFactory, web3, dispatch) => {
	try {
		dispatch(walletCreating(true))
		traderPaired.methods.createInvestment().send({from: account})
		.on('transactionHash', async (hash) => {
			
		})
		.on('receipt', async (receipt) => {
			loadMainWallet(account, walletFactory, web3, dispatch)
		})
		.on('error', (error) => {
			console.log('Could not createWallet', error)
			dispatch(walletCreating(false))
		})
	} catch (error) {
		console.log('Could not createWallet', error)
		return null
	}
}

const loadMainWallet = async (account, walletFactory, web3, dispatch) => {
	let wallet = null
	const wallets = await walletFactory.methods.getInstantiations(account).call()
	if (wallets.length > 0) {
		wallet = await new web3.eth.Contract(MultiSigFundWallet.abi, wallets[0], {handleRevert: true})
		await registerWalletEvents(wallet, dispatch)
		dispatch(mainWalletLoaded(wallet))
	}
}

const getInvestmentWallet = async (investment, web3, dispatch) => {
	try {
		let wallet = await new web3.eth.Contract(MultiSigFundWallet.abi, investment.wallet, {handleRevert: true})
		return wallet
	} catch (error) {
		console.log('Could not getInvestmentWallet', error)
		return null
	}
}

const registerWalletEvents = async (wallet, dispatch) => {
    const stream = await wallet.getPastEvents(
		'DisbursementCreated',
		{
			filter: {},
			fromBlock: 0
		}
	)
	const disbursements = stream.map(event => event.returnValues)
	disbursements.forEach(disbursement => dispatch(disbursementCreated(disbursement)))

	wallet.events.DisbursementCreated({filter: {}}, (error, event) => {
		dispatch(disbursementCreated(event.returnValues))
	})
}

const loadInvestorInvestments = async (investor, traderPaired, pairedInvestments, dispatch) => {
	let stream = await traderPaired.getPastEvents(
		'Invest',
		{
			filter: {investor: investor.user},
			fromBlock: 0
		}
	)
	let investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapInvest(investment))))

	stream = await traderPaired.getPastEvents(
		'Stop',
		{
			filter: {investor: investor.user},
			fromBlock: 0
		}
	)
	investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapStop(investment))))

	stream = await traderPaired.getPastEvents(
		'RequestExit',
		{
			filter: {investor: investor.user},
			fromBlock: 0
		}
	)
	investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapRequestExit(investment))))

	stream = await traderPaired.getPastEvents(
		'ApproveExit',
		{
			filter: {investor: investor.user},
			fromBlock: 0
		}
	)
	investments = stream.map(event => event.returnValues)
	investments.forEach(investment => dispatch(investmentLoaded(mapApproveExit(investment))))

	traderPaired.events.Invest({filter: {investor: investor.user}}, (error, event) => {
		dispatch(investmentLoaded(mapInvest(event.returnValues)))
	})

	traderPaired.events.Stop({filter: {investor: investor.user}}, (error, event) => {
		dispatch(investmentLoaded(mapStop(event.returnValues)))
	})

	traderPaired.events.RequestExit({filter: {investor: investor.user}}, (error, event) => {
		dispatch(investmentLoaded(mapRequestExit(event.returnValues)))
	})

	traderPaired.events.ApproveExit({filter: {investor: investor.user}}, (error, event) => {
		dispatch(investmentLoaded(mapApproveExit(event.returnValues)))
	})
}

export const invest = async (account, trader, tokenAddress, token, amount, wallet, dispatch) => {
	try {
		const isTrader = await wallet.methods.traders(trader).call()
		if (!isTrader) {
			wallet.methods.setTrader(trader, true).send({from: account})
			.on('transactionHash', async (hash) => {
				
			})
			.on('receipt', async (receipt) => {
				investInTrader(account, trader, tokenAddress, token, amount, wallet, dispatch)
			})
			.on('error', (error) => {
				console.log('Could not invest', error)
			})
		} else {
			investInTrader(account, trader, tokenAddress, token, amount, wallet, dispatch)
		}
		
	} catch (error) {
		console.log('Could not invest', error)
		return null
	}
}

const investInTrader = async (account, trader, tokenAddress, token, amount, wallet, dispatch) => {
	try {
		if (tokenAddress === ZERO_ADDRESS) {
			amount = etherToWei(amount, 18)

			wallet.methods.fundEther(trader).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
			})
			.on('receipt', async (receipt) => {
				console.log("FUNDED ETHER!")
			})
			.on('error', (error) => {
				console.log('Could not fundEther', error)
			})
		} else {
			console.log("T", token)
			amount = etherToWei(amount, token.decimals)

			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
			})
			.on('receipt', async (receipt) => {
				wallet.methods.fundToken(trader, token.contract.options.address, amount).send({from: account})
				.on('transactionHash', async (hash) => {
				})
				.on('receipt', async (receipt) => {
					console.log("FUNDED TOKEN!")
				})
				.on('error', (error) => {
					console.log('Could not fundToken', error)
				})
			})
			.on('error', (error) => {
				console.log('Could not approve token', error)
			})
		}
		
	} catch (error) {
		console.log('Could not investInTrader', error)
		return null
	}
}

export const stopInvestment = (account, investment, wallet, dispatch) => {
	try {
		dispatch(investmentChanging(investment, true))
		wallet.methods.stop(investment.trader, investment.id).send({from: account})
		.on('transactionHash', async (hash) => {
			
		})
		.on('receipt', async (receipt) => {
		})
		.on('error', (error) => {
			console.log('Could not stopInvestment', error)
			dispatch(investmentChanging(investment, false))
		})
	} catch (error) {
		console.log('Could not stopInvestment', error)
		return null
	}
}

export const disburseInvestment = (account, investment, wallet, dispatch) => {
	try {
		dispatch(investmentChanging(investment, true))
		if (investment.token === ZERO_ADDRESS) {
			wallet.methods.disburseEther(investment.trader, investment.id, investment.value).send({from: account})
			.on('transactionHash', async (hash) => {
				
			})
			.on('receipt', async (receipt) => {
			})
			.on('error', (error) => {
				console.log('Could not disburseInvestment', error)
				dispatch(investmentChanging(investment, false))
			})
		} else {
			wallet.methods.disburseToken(investment.trader, investment.id, investment.token, investment.value, 0).send({from: account})
			.on('transactionHash', async (hash) => {
				
			})
			.on('receipt', async (receipt) => {
			})
			.on('error', (error) => {
				console.log('Could not disburseInvestment', error)
				dispatch(investmentChanging(investment, false))
			})
		}
		
	} catch (error) {
		console.log('Could not disburseInvestment', error)
		return null
	}
}

export const approveDisbursement = (account, investment, wallet, dispatch) => {
	try {
		dispatch(investmentChanging(investment, true))
		if (investment.token === ZERO_ADDRESS) {
			wallet.methods.approveDisbursementEther(investment.trader, investment.disbursementId).send({from: account})
			.on('transactionHash', async (hash) => {
				
			})
			.on('receipt', async (receipt) => {
			})
			.on('error', (error) => {
				console.log('Could not approveDisbursement', error)
				dispatch(investmentChanging(investment, false))
			})
		} else {
			wallet.methods.approveDisbursementToken(investment.trader, investment.disbursementId, investment.token, 0).send({from: account})
			.on('transactionHash', async (hash) => {
				
			})
			.on('receipt', async (receipt) => {
			})
			.on('error', (error) => {
				console.log('Could not approveDisbursement', error)
				dispatch(investmentChanging(investment, false))
			})
		}
		
	} catch (error) {
		console.log('Could not approveDisbursement', error)
		return null
	}
}

const mapTrader = (event) => {
	return {
		... event,
		date: moment.unix(event.date)
	}
}

const mapInvest = (event) => {
	return {
		... event,
		amount: new BigNumber(event.amount),
		value: new BigNumber(event.amount),
		start: moment.unix(event.date),
		date: moment.unix(event.date),
		state: 0
	}
}

const mapStop = (event) => {
	return {
		... event,
		end: moment.unix(event.date),
		date: moment.unix(event.date),
		state: 1
	}
}

const mapRequestExit = (event) => {
	return {
		... event,
		value: new BigNumber(event.value),
		date: moment.unix(event.date),
		state: 2
	}
}

const mapApproveExit = (event) => {
	return {
		... event,
		date: moment.unix(event.date),
		state: 4
	}
}

export const loadInvestmentValues = (investments, traderPaired, dispatch) => {
	investments.forEach(async (investment) => {
		console.log("loadInvestmentValues", investment)
		// get all positions for this investment
		let positions = await getTraderPositions(investment.trader)
		positions = positions.filter(
			(position) => addressForAsset(position.asset) === investment.token
						&& position.start.isAfter(investment.start) 
						&& ((position.end.isBefore(investment.end)
							|| investment.state === 0))
		)

		console.log("P", positions)

		const traderInvestments = await getTraderInvestments(investment.trader, traderPaired)

		console.log("traderInvestments", traderInvestments)

		// for each position get all investments that it should be split over
		// and calculate profit/loss
		let profit = new BigNumber(0)
		await positions.forEach(async (position) => {
			console.log("position.profit", position.profit.toString())
			let totalAmount = await getPositionInvestmentsAmount(position, traderInvestments)
			console.log("totalAmount", totalAmount.toString())

			// split profit according to share of total amount
			let sharePercentage = investment.amount.dividedBy(totalAmount)
			console.log("sharePercentage", sharePercentage.toString())

			let positionProfit = position.profit.multipliedBy(sharePercentage)
			console.log("positionProfit", positionProfit.toString())

			profit = profit.plus(positionProfit)
		})

		console.log("profit", profit.toString())
		investment.value = investment.amount.plus(profit)
		dispatch(investmentLoaded(investment))
	})
}

const getTraderInvestments = async (account, traderPaired) => {
	let result = []
	try {
		let stream = await traderPaired.getPastEvents(
			'Invest',
			{
				filter: {trader: account},
				fromBlock: 0
			}
		)
		let investList = stream.map(event => mapInvest(event.returnValues))

		stream = await traderPaired.getPastEvents(
			'Stop',
			{
				filter: {trader: account},
				fromBlock: 0
			}
		)
		let stopList = stream.map(event => mapStop(event.returnValues))

		investList.forEach((investment) => {
			let index = stopList.findIndex(stopped => stopped.id === investment.id)
			if (index !== -1) {
				investment.state = stopList[index].state
				investment.end = stopList[index].end
			}
			return investment
		})
		result = investList

	} catch (error) {
		console.log('Could not getTraderInvestments', error)
	}
	return result
}

const getPositionInvestmentsAmount = async (position, traderInvestments) => {
	const investments = traderInvestments.filter(
		(investment) => addressForAsset(position.asset) === investment.token
					&& position.start.isAfter(investment.start) 
						&& ((position.end.isBefore(investment.end)
							|| investment.state === 0))
	)
	
	let totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), new BigNumber(0))
	return totalAmount
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

