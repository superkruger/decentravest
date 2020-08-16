import Web3 from 'web3'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import TraderPaired from '../abis/TraderPaired.json'
import PairedInvestments from '../abis/PairedInvestments.json'
import MultiSigFundWalletFactory from '../abis/MultiSigFundWalletFactory.json'
import MultiSigFundWallet from '../abis/MultiSigFundWallet.json'
import ERC20 from '../abis/IERC20.json'
import { log, ZERO_ADDRESS, INVESTMENT_COLLATERAL, INVESTMENT_DIRECT, toBN, etherToWei, tokenAddressForSymbol, tokenSymbolForAddress, info, fail } from '../helpers'
import { getTraderPositions } from './dydxInteractions'
import {
	notificationAdded,
	notificationRemoved,
	web3Loaded,
	web3AccountLoaded,
	traderPairedLoaded,
	pairedInvestmentsLoaded,
	adminLoaded,
	tokensLoaded,
	balanceLoaded,
	traderLoaded,
	mainTraderLoaded,
	mainInvestorLoaded,
	traderJoining,
	investorJoining,
	pageSelected,
	traderAllocationLoaded,
	walletFactoryLoaded,
	walletCreating,
	mainWalletLoaded,
	mainWalletBalanceLoaded,
	investmentLoaded,
	investmentChanging,
	disbursementCreated
} from './actions.js'

const FACC = `${process.env.REACT_APP_FACC}`

export const loadWeb3 = async (dispatch) => {

	let web3
	if (window.ethereum) {
		web3 = new Web3(window.ethereum)
		await window.ethereum.request({ method: 'eth_requestAccounts' })

		window.ethereum.on('accountsChanged', async function (accounts) {
			// await loadWebApp(web3, dispatch)
			document.location.reload()
		})

		window.ethereum.on('chainChanged', () => {
			document.location.reload()
		})
	} else if (window.web3) {
		web3 = new Web3(window.web3.currentProvider || Web3.givenProvider || 'http://127.0.0.1:8545')
	}
	else {
		log('nothing')
		// Do nothing....
	}

	if (web3) {
		web3.eth.handleRevert = true
		dispatch(web3Loaded(web3))
	}
	return web3
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


export const loadMainWalletBalances = async (wallet, tokens, dispatch) => {

	const etherBalance = await wallet.methods.etherBalance().call()
	dispatch(mainWalletBalanceLoaded({amount: new BigNumber(etherBalance), symbol: "ETH"}))

	tokens.forEach(async (token) => {
		const tokenBalance = await wallet.methods.tokenBalance(token.contract.options.address).call()
		dispatch(mainWalletBalanceLoaded({amount: new BigNumber(tokenBalance), symbol: token.symbol}))
	})
}

export const loadTraderPaired = async (account, web3, networkId, dispatch) => {
	try {
		log("loadTraderPaired", TraderPaired)
		if (TraderPaired.networks[networkId] !== undefined) {
			log("TraderPaired address: ", TraderPaired.networks[networkId].address)
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

			const traderCount = await traderPaired.methods.traderCount().call()
			const investorCount = await traderPaired.methods.investorCount().call()

			console.log("TI", traderCount, investorCount)

			loadTraders(traderPaired, dispatch)
			dispatch(traderPairedLoaded(traderPaired))

			const trader = await traderPaired.methods.traders(account).call()
			const investor = await traderPaired.methods.investors(account).call()

			if (trader && trader.user !== ZERO_ADDRESS) {
				await loadMainTrader(trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
			}

			if (investor && investor.user !== ZERO_ADDRESS) {
				await loadMainInvestor(investor, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
			}

			if (account === FACC) {
				await loadAdmin(account, traderPaired, dispatch)
			}

			return traderPaired
		}
	} catch (err) {
		log('Contract not deployed to the current network', err)
		dispatch(notificationAdded(info("Network", "Please connect to the mainnet")))
	}
	return null
}

const loadMainTrader = async (trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {
	await loadTraderInvestments(trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
	await loadTraderAllocations(trader.user, traderPaired, dispatch)

	dispatch(mainTraderLoaded(trader))
}

const loadMainInvestor = async (investor, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {
	await loadInvestorInvestments(investor, traderPaired, pairedInvestments, dispatch)
	await loadMainWallet(investor.user, walletFactory, web3, dispatch)
	
	dispatch(mainInvestorLoaded(investor))
}

const loadAdmin = async (admin, traderPaired, dispatch) => {
	// await loadInvestors(investor, traderPaired, pairedInvestments, dispatch)
	
	dispatch(adminLoaded())
}

const loadTraders = async (traderPaired, dispatch) => {

	const traderCount = await traderPaired.methods.traderCount().call()
	for (let i = 1; i <= traderCount; i++) {
		const traderAddress = await traderPaired.methods.traderAddresses(i).call()
		const trader = await traderPaired.methods.traders(traderAddress).call()
		dispatch(traderLoaded(mapTrader(trader)))
		await loadTraderAllocations(trader.user, traderPaired, dispatch)
	}

	traderPaired.events.Trader({filter: {}}, (err, event) => {
		loadTraderAllocations(event.returnValues.user, traderPaired, dispatch)
		dispatch(traderLoaded(mapTrader(event.returnValues)))
	})

}

const loadTraderInvestments = async (trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {

	for (let i = 1; i <= trader.investmentCount; i++) {
		const investmentId = await traderPaired.methods.traderInvestments(trader.user, i).call()
		const investment = await pairedInvestments.methods.investments(investmentId).call()
		const wallets = await walletFactory.methods.getInstantiations(investment.investor).call()
		investment.wallet = wallets[0]
		investment.walletContract = await getInvestmentWallet(investment, web3, dispatch)
		dispatch(investmentLoaded(mapInvestment(investment)))
		await registerWalletEvents(investment.walletContract, dispatch)
	}

	traderPaired.events.Invest({filter: {trader: trader.user}}, (err, event) => {
		dispatch(investmentLoaded(mapInvest(event.returnValues)))
	})

	traderPaired.events.Stop({filter: {trader: trader.user}}, (err, event) => {
		dispatch(investmentLoaded(mapStop(event.returnValues)))
	})

	traderPaired.events.RequestExit({filter: {trader: trader.user}}, (err, event) => {
		dispatch(investmentLoaded(mapRequestExit(event.returnValues)))
	})
	
	traderPaired.events.ApproveExit({filter: {trader: trader.user}}, (err, event) => {
		dispatch(investmentLoaded(mapApproveExit(event.returnValues)))
	})

	traderPaired.events.RejectExit({filter: {trader: trader.user}}, (err, event) => {
		dispatch(investmentLoaded(mapRejectExit(event.returnValues)))
	})
}

export const joinAsTrader = async (account, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {
	try {
		traderPaired.methods.joinAsTrader().send({from: account})
		.on('transactionHash', (hash) => {
			dispatch(traderJoining())
			dispatch(notificationAdded(info("Trader", "Joining as trader...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))

			const trader = await traderPaired.methods.traders(account).call()

			if (trader.user !== ZERO_ADDRESS) {
				await loadMainTrader(trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
				dispatch(pageSelected('trader'))
				dispatch(notificationAdded(info("Trader", "Successfully registered as a trader!")))
			}
		})
		.on('error', (err) => {
			log('Could not joinAsTrader', err)
			dispatch(notificationAdded(fail("Trader", "Could not join as trader")))
		})
	} catch (err) {
		log('Could not joinAsTrader', err)
		return null
	}
}

export const joinAsInvestor = async (account, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {
	try {
		traderPaired.methods.joinAsInvestor().send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(investorJoining())
			dispatch(notificationAdded(info("Investor", "Joining as investor...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))

			const investor = await traderPaired.methods.investors(account).call()

			if (investor.user !== ZERO_ADDRESS) {
				await loadMainInvestor(investor, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
				dispatch(pageSelected('investor'))
				dispatch(notificationAdded(info("Investor", "Successfully registered as an investor")))
			}
		})
		.on('error', (err) => {
			log('Could not joinAsInvestor', err)
			dispatch(notificationAdded(fail("Investor", "Could not join as investor")))
		})
	} catch (err) {
		log('Could not joinAsInvestor', err)
		return null
	}
}


export const loadTraderAllocations = async (account, traderPaired, dispatch) => {
	try {
		// Current allocations

		// ETH
		let tokenAllocation = await traderPaired.methods.allocations(account, ZERO_ADDRESS).call()
		tokenAllocation.token = ZERO_ADDRESS
		dispatch(traderAllocationLoaded(account, mapAllocation(tokenAllocation)))

		// DAI
		tokenAllocation = await traderPaired.methods.allocations(account, `${process.env.REACT_APP_DAI_ADDRESS}`).call()
		tokenAllocation.token = `${process.env.REACT_APP_DAI_ADDRESS}`
		dispatch(traderAllocationLoaded(account, mapAllocation(tokenAllocation)))

		// USDC
		tokenAllocation = await traderPaired.methods.allocations(account, `${process.env.REACT_APP_USDC_ADDRESS}`).call()
		tokenAllocation.token = `${process.env.REACT_APP_USDC_ADDRESS}`
		dispatch(traderAllocationLoaded(account, mapAllocation(tokenAllocation)))

		// New allocations
		traderPaired.events.Allocate({filter: {trader: account}}, (err, event) => {
			dispatch(traderAllocationLoaded(account, mapAllocation(event.returnValues)))
		})

	} catch (err) {
		log('Could not loadTraderAllocations', err)
		return null
	}
}

const mapAllocation = (allocation) => {
	
	return {
		invested: new BigNumber(allocation.invested),
		total: new BigNumber(allocation.total),
		symbol: tokenSymbolForAddress(allocation.token),
		token: allocation.token,
		date: moment.unix(allocation.date).utc()
	}
}

export const setTraderAllocation = async (account, tokenAddress, amount, decimals, traderPaired, dispatch) => {
	try {
		log("setTraderAllocation", tokenAddress, amount.toString(), decimals)

		traderPaired.methods.allocate(tokenAddress, toBN(etherToWei(amount, decimals))).send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Allocation", "Setting allocation...", hash)))
		})
		.on('receipt', async (receipt) => {
			log("receipt", receipt)
			dispatch(notificationRemoved(receipt.transactionHash))
			dispatch(notificationAdded(info("Allocation", "Allocation set")))
		})
		.on('error', (err) => {
			log('Could not setTraderAllocation', err)
			dispatch(notificationAdded(fail("Allocation", "Could not set allocation")))
		})
	} catch (err) {
		log('Could not setTraderAllocation', err)
		return null
	}
}

export const createWallet = async (account, traderPaired, walletFactory, web3, dispatch) => {
	try {
		dispatch(walletCreating(true))
		traderPaired.methods.createInvestment().send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Wallet", "Creating wallet...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))
			loadMainWallet(account, walletFactory, web3, dispatch)
			dispatch(notificationAdded(info("Wallet", "Wallet created")))
		})
		.on('error', (err) => {
			log('Could not createWallet', err)
			dispatch(walletCreating(false))
			dispatch(notificationAdded(fail("Wallet", "Could not create wallet")))
		})
	} catch (err) {
		log('Could not createWallet', err)
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
		const wallet = await new web3.eth.Contract(MultiSigFundWallet.abi, investment.wallet, {handleRevert: true})
		return wallet
	} catch (err) {
		log('Could not getInvestmentWallet', err)
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

	wallet.events.DisbursementCreated({filter: {}}, (err, event) => {
		log("DisbursementCreated.value", event.returnValues['value'])
		dispatch(disbursementCreated(event.returnValues))
	})
}

const loadInvestorInvestments = async (investor, traderPaired, pairedInvestments, dispatch) => {

	for (let i = 1; i <= investor.investmentCount; i++) {
		const investmentId = await traderPaired.methods.investorInvestments(investor.user, i).call()
		const investment = await pairedInvestments.methods.investments(investmentId).call()
		// const wallets = await walletFactory.methods.getInstantiations(investment.investor).call()
		// investment.wallet = wallets[0]
		// investment.walletContract = await getInvestmentWallet(investment, web3, dispatch)
		dispatch(investmentLoaded(mapInvestment(investment)))
		// await registerWalletEvents(investment.walletContract, dispatch)
	}

	traderPaired.events.Invest({filter: {investor: investor.user}}, (err, event) => {
		dispatch(investmentLoaded(mapInvest(event.returnValues)))

		// load allocation
		dispatch(traderAllocationLoaded(
			event.returnValues['trader'],
			mapAllocation({
				invested: event.returnValues['allocationInvested'],
				total: event.returnValues['allocationTotal'],
				token: event.returnValues['token'],
				date: event.returnValues['date']
			})
		))
	})

	traderPaired.events.Stop({filter: {investor: investor.user}}, (err, event) => {
		dispatch(investmentLoaded(mapStop(event.returnValues)))
	})

	traderPaired.events.RequestExit({filter: {investor: investor.user}}, (err, event) => {
		dispatch(investmentLoaded(mapRequestExit(event.returnValues)))
	})

	traderPaired.events.ApproveExit({filter: {investor: investor.user}}, (err, event) => {
		dispatch(investmentLoaded(mapApproveExit(event.returnValues)))

		// load allocation
		dispatch(traderAllocationLoaded(
			event.returnValues['trader'],
			mapAllocation({
				invested: event.returnValues['allocationInvested'],
				total: event.returnValues['allocationTotal'],
				token: event.returnValues['token'],
				date: event.returnValues['date']
			})
		))
	})

	traderPaired.events.RejectExit({filter: {investor: investor.user}}, (err, event) => {
		dispatch(investmentLoaded(mapRejectExit(event.returnValues)))
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
				await investInTrader(account, trader, tokenAddress, token, amount, wallet, dispatch)
			})
			.on('error', (err) => {
				log('Could not invest', err)
			})
		} else {
			await investInTrader(account, trader, tokenAddress, token, amount, wallet, dispatch)
		}
		
	} catch (err) {
		log('Could not invest', err)
		return null
	}
}

const investInTrader = async (account, trader, tokenAddress, token, amount, wallet, dispatch) => {
	try {
		if (tokenAddress === ZERO_ADDRESS) {

			wallet.methods.fundEther(trader, INVESTMENT_COLLATERAL).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Investing ether...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Invested ether")))
			})
			.on('error', (err) => {
				log('Could not fundEther', err)
				dispatch(notificationAdded(fail("Investment", "Could not invest ether")))
			})
		} else {

			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Aproving tokens...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				wallet.methods.fundToken(trader, token.contract.options.address, amount, INVESTMENT_COLLATERAL).send({from: account})
				.on('transactionHash', async (hash) => {
					dispatch(notificationAdded(info("Investment", "Investing tokens...", hash)))
				})
				.on('receipt', async (receipt) => {
					dispatch(notificationRemoved(receipt.transactionHash))
					dispatch(notificationAdded(info("Investment", "Invested tokens")))
				})
				.on('error', (err) => {
					log('Could not fundToken', err)
					dispatch(notificationAdded(fail("Investment", "Could not invest token")))
				})
			})
			.on('error', (err) => {
				log('Could not approve token', err)
				dispatch(notificationAdded(fail("Investment", "Could not approve token amount")))
			})
		}
		
	} catch (err) {
		log('Could not investInTrader', err)
		return null
	}
}

export const stopInvestment = (account, investment, wallet, dispatch) => {
	try {
		dispatch(investmentChanging(investment, true))
		wallet.methods.stop(investment.trader, investment.id).send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Investment", "Stopping investment...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))
			dispatch(notificationAdded(info("Investment", "Stopped investment")))
		})
		.on('error', (err) => {
			log('Could not stopInvestment', err)
			dispatch(investmentChanging(investment, false))
			dispatch(notificationAdded(fail("Investment", "Could not stop investment")))
		})
	} catch (err) {
		log('Could not stopInvestment', err)
		return null
	}
}

export const disburseInvestment = async (account, investment, wallet, token, pairedInvestments, dispatch) => {
	try {
		let profitsAndFees = await pairedInvestments.methods.calculateProfitsAndFees(toBN(investment.grossValue), toBN(investment.amount), 100, 100, investment.investorProfitPercent).call()
		log("profitsAndFees", profitsAndFees)

		let amount = 0
		if (account === investment.trader) {
			if (investment.grossValue.isGreaterThan(investment.amount)) {

				if (investment.investmentType === INVESTMENT_DIRECT) {
					amount = amount.plus(investment.amount)
				}

				amount = toBN(amount.plus(new BigNumber(profitsAndFees[3])).plus(new BigNumber(profitsAndFees[0])).plus(new BigNumber(profitsAndFees[1])))

			} else {

				if (investment.investmentType === INVESTMENT_DIRECT) {
					amount = amount.plus(investment.grossValue)
				}

				amount = toBN(amount.plus(new BigNumber(profitsAndFees[0])))
			}
		}
		log("disburseInvestment amount", amount.toString())

		dispatch(investmentChanging(investment, true))
		if (investment.token === ZERO_ADDRESS) {
			wallet.methods.disburseEther(investment.trader, investment.id, toBN(investment.grossValue)).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Requesting disbursement...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Disbursement requested")))
			})
			.on('error', (err) => {
				log('Could not disburseInvestment', err)
				dispatch(investmentChanging(investment, false))
				dispatch(notificationAdded(fail("Investment", "Could not request disbursement")))
			})
		} else {

			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Approving tokens...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				wallet.methods.disburseToken(investment.trader, investment.id, investment.token, toBN(investment.grossValue), amount).send({from: account})
				.on('transactionHash', async (hash) => {
					dispatch(notificationAdded(info("Investment", "Requesting disbursement...", hash)))
				})
				.on('receipt', async (receipt) => {
					dispatch(notificationRemoved(receipt.transactionHash))
					dispatch(notificationAdded(info("Investment", "Disbursement requested")))
				})
				.on('error', (err) => {
					log('Could not disburseInvestment', err)
					dispatch(investmentChanging(investment, false))
					dispatch(notificationAdded(fail("Investment", "Could not request disbursement")))
				})
			})
			.on('error', (err) => {
				log('Could not approve token', err)
				dispatch(investmentChanging(investment, false))
				dispatch(notificationAdded(fail("Investment", "Could not approve token amount")))
			})
		}
		
	} catch (err) {
		log('Could not disburseInvestment', err)
		return null
	}
}

export const approveDisbursement = async (account, investment, wallet, token, pairedInvestments, dispatch) => {
	try {
		let profitsAndFees = await pairedInvestments.methods.calculateProfitsAndFees(toBN(investment.grossValue), toBN(investment.amount), 100, 100, investment.investorProfitPercent).call()
		log("profitsAndFees", profitsAndFees)


		let amount = new BigNumber(0)
		if (account === investment.trader) {
			if (investment.grossValue.isGreaterThan(investment.amount)) {

				if (investment.investmentType === INVESTMENT_DIRECT) {
					amount = amount.plus(investment.amount)
				}

				amount = toBN(amount.plus(new BigNumber(profitsAndFees[3])).plus(new BigNumber(profitsAndFees[0])).plus(new BigNumber(profitsAndFees[1])))

			} else {

				if (investment.investmentType === INVESTMENT_DIRECT) {
					amount = amount.plus(investment.grossValue)
				}

				amount = toBN(amount.plus(new BigNumber(profitsAndFees[0])))
			}
		}

		log("disburseInvestment", account, investment.trader, investment.disbursementId, amount.toString())

		dispatch(investmentChanging(investment, true))
		if (investment.token === ZERO_ADDRESS) {
			wallet.methods.approveDisbursementEther(investment.trader, investment.disbursementId).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Approving disbursement...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Disbursement approved")))
			})
			.on('error', (err) => {
				log('Could not approveDisbursement', err)
				dispatch(investmentChanging(investment, false))
				dispatch(notificationAdded(fail("Investment", "Could not approve disbursement")))
			})
		} else {
			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
			})
			.on('receipt', async (receipt) => {
				wallet.methods.approveDisbursementToken(investment.trader, investment.disbursementId, investment.token, amount).send({from: account})
				.on('transactionHash', async (hash) => {
					dispatch(notificationAdded(info("Investment", "Approving disbursement...", hash)))
				})
				.on('receipt', async (receipt) => {
					dispatch(notificationRemoved(receipt.transactionHash))
					dispatch(notificationAdded(info("Investment", "Disbursement approved")))
				})
				.on('error', (err) => {
					log('Could not approveDisbursement', err)
					dispatch(investmentChanging(investment, false))
					dispatch(notificationAdded(fail("Investment", "Could not approve disbursement")))
				})
			})
			.on('error', (err) => {
				log('Could not approve token', err)
				dispatch(investmentChanging(investment, false))
				dispatch(notificationAdded(fail("Investment", "Could not approve token amount")))
			})
		}
		
	} catch (err) {
		log('Could not approveDisbursement', err)
		return null
	}
}

export const rejectDisbursement = async (account, investment, wallet, pairedInvestments, dispatch) => {
	try {
		log("reject disburseInvestment", account, investment.trader, investment.disbursementId, toBN(investment.grossValue))

		dispatch(investmentChanging(investment, true))
		wallet.methods.rejectDisbursement(investment.trader, investment.disbursementId, investment.token, toBN(investment.grossValue)).send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Investment", "Rejecting disbursement...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))
			dispatch(notificationAdded(info("Investment", "Disbursement rejected")))
		})
		.on('error', (err) => {
			log('Could not rejectDisbursement', err)
			dispatch(investmentChanging(investment, false))
			dispatch(notificationAdded(fail("Investment", "Could not reject disbursement")))
		})
		
	} catch (err) {
		log('Could not rejectDisbursement', err)
		return null
	}
}
const mapTrader = (event) => {
	return {
		...event,
		date: moment.unix(event.date).utc()
	}
}

const mapInvest = (event) => {
	return {
		...event,
		amount: new BigNumber(event.amount),
		value: new BigNumber(0),
		grossValue: new BigNumber(event.amount),
		nettValue: new BigNumber(event.amount),
		investorProfitPercent: new BigNumber(event.investorProfitPercent),
		investmentType: parseInt(event.investmentType, 10),
		start: moment.unix(event.date).utc(),
		end: moment.unix(0).utc(),
		// date: moment.unix(event.date).utc(),
		invested: new BigNumber(event.invested),
		state: "0"
	}
}

const mapInvestment = (investment) => {
	return {
		...investment,
		amount: new BigNumber(investment.amount),
		value: new BigNumber(investment.value),
		grossValue: new BigNumber(investment.amount),
		nettValue: new BigNumber(investment.amount),
		investorProfitPercent: new BigNumber(investment.investorProfitPercent),
		investmentType: parseInt(investment.investmentType, 10),
		start: moment.unix(investment.start).utc(),
		end: moment.unix(investment.end).utc(),
		startUnix: investment.start,
		endUnix: investment.end
	}
}

const mapStop = (event) => {
	return {
		...event,
		end: moment.unix(event.date).utc(),
		date: moment.unix(event.date).utc(),
		state: "1"
	}
}

const mapRequestExit = (event) => {

	let state = "2"
	if (event.from === event.trader) {
		state = "3"
	}

	return {
		...event,
		value: new BigNumber(event.value),
		date: moment.unix(event.date).utc(),
		state: state
	}
}

const mapApproveExit = (event) => {
	return {
		...event,
		date: moment.unix(event.date).utc(),
		state: "4"
	}
}

const mapRejectExit = (event) => {
	return {
		...event,
		value: new BigNumber(event.value),
		date: moment.unix(event.date).utc(),
		state: "1"
	}
}

export const loadInvestmentValues = (investments, traderPaired, dispatch) => {
	investments.forEach(async (investment) => {
		log("loadInvestmentValues", investment)
		let investorProfitPercent = investment.investorProfitPercent.dividedBy(10000)


		// get all positions for this investment
		let positions = await getTraderPositions(investment.trader)
		positions = positions.filter(
			(position) => tokenAddressForSymbol(position.asset) === investment.token)

		// if(process.env.NODE_ENV !== 'development') {
			// filter by date
			positions = positions.filter(position =>
				position.start.isAfter(investment.start) 
					&& (
						(investment.end.unix() === 0 || investment.state === "0") 
							|| position.end.isBefore(investment.end)))
		// }

		log("P", positions)

		const allocations = await getTraderAllocations(investment.trader, investment.token, traderPaired)


		console.log("A", allocations)


		const traderInvestments = await getTraderInvestments(investment.trader, investment.token, traderPaired)

		log("traderInvestments", traderInvestments)

		// for each position get all investments that it should be split over
		// and calculate profit/loss
		let grossProfit = new BigNumber(0)
		await positions.forEach(async (position) => {

			// find the allocation just before the start of this position
			let allocation = allocations.find(allocation => allocation.date.isBefore(position.start))

			// Fallback to the last allocation made, but there should be an allocation made before the position started
			// TODO: maybe remove?
			if (!allocation) {
				allocation = allocations[0]
			}

			console.log("allocation total", allocation.total.toString())

			log("position.profit", position.nettProfit.toString())
			let totalAmount = await getPositionInvestmentsAmount(position, traderInvestments)
			log("totalAmount", totalAmount.toString())

			let investorsShare = totalAmount.dividedBy(allocation.total)
			log("investorsShare", investorsShare.toString())

			// split profit according to share of total amount
			let sharePercentage = investment.amount.dividedBy(totalAmount)
			log("sharePercentage", sharePercentage.toString())

			let positionProfit = position.nettProfit.multipliedBy(sharePercentage).multipliedBy(investorsShare)
			log("positionProfit", positionProfit.toString())

			grossProfit = grossProfit.plus(positionProfit)
		})

		if (investment.amount.plus(grossProfit).isNegative()) {
			// if losses would amount to a negative valuation, just make the loss equal to the investment amount
			grossProfit = investment.amount.negated()
		}

		let nettProfit = grossProfit
		if (nettProfit.isPositive()) {
			nettProfit = nettProfit.multipliedBy(investorProfitPercent).multipliedBy(0.99)
		}
		log("grossProfit", grossProfit.toString())
		log("nettProfit", nettProfit.toString())
		investment.grossValue = investment.amount.plus(grossProfit)
		investment.nettValue = investment.amount.plus(nettProfit)
		dispatch(investmentLoaded(investment))
	})
}

const getTraderAllocations = async (account, token, traderPaired) => {
	let stream = await traderPaired.getPastEvents(
		'Allocate',
		{
			filter: {trader: account, token: token},
			fromBlock: 0
		}
	)
	// sort descending
	let allocations = stream.map(event => mapAllocation(event.returnValues))
						.sort((a, b) => b.date.unix() - a.date.unix())

	return allocations
}

const getTraderInvestments = async (account, token, traderPaired) => {
	let result = []
	try {
		let stream = await traderPaired.getPastEvents(
			'Invest',
			{
				filter: {trader: account, token: token},
				fromBlock: 0
			}
		)
		let investList = stream.map(event => mapInvest(event.returnValues))

		stream = await traderPaired.getPastEvents(
			'Stop',
			{
				filter: {trader: account, token: token},
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

	} catch (err) {
		log('Could not getTraderInvestments', err)
	}
	return result
}

const getPositionInvestmentsAmount = async (position, traderInvestments) => {
	let investments = traderInvestments.filter((investment) => tokenAddressForSymbol(position.asset) === investment.token)
	
	// if(process.env.NODE_ENV !== 'development') {
		// filter by date
		investments = investments.filter(investment =>
			position.start.isAfter(investment.start) 
				&& (
					(investment.end.unix() === 0 || investment.state === "0") 
						|| position.end.isBefore(investment.end)))
	// }
	
	let totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), new BigNumber(0))
	return totalAmount
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

