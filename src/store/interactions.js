import Web3 from 'web3'
import BigNumber from 'bignumber.js'
import TraderPaired from '../abis/TraderPaired.json'
import PairedInvestments from '../abis/PairedInvestments.json'
import MultiSigFundWalletFactory from '../abis/MultiSigFundWalletFactory.json'
import MultiSigFundWallet from '../abis/MultiSigFundWallet.json'
import ERC20 from '../abis/IERC20.json'
import { ZERO_ADDRESS, etherToWei } from '../helpers'
import { 
	web3Loaded,
	web3AccountLoaded,
	traderPairedLoaded,
	pairedInvestmentsLoaded,
	tokensLoaded,
	balanceLoaded,
	traderLoaded,
	investorLoaded,
	traderJoining,
	investorJoining,
	pageSelected,
	tradersLoaded,
	traderAllocationsLoaded,
	walletFactoryLoaded,
	walletCreating,
	walletLoaded,
	investorInvestmentsLoaded
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

	console.log("tokens", tokens)
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

			const trader = await traderPaired.methods.traders(account).call()
			// console.log('Trader', trader)
			const investor = await traderPaired.methods.investors(account).call()
			// console.log('Investor', investor)

			if (trader && trader.user !== ZERO_ADDRESS) {
				dispatch(traderLoaded(trader))
			}
			if (investor && investor.user !== ZERO_ADDRESS) {
				dispatch(investorLoaded(investor))
			}

			loadTraders(traderPaired, dispatch)
			dispatch(traderPairedLoaded(traderPaired))

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

			return traderPaired
		}
	} catch (error) {
		console.log('Contract not deployed to the current network', error)
	}
	return null
}

const loadTraders = async (traderPaired, dispatch) => {
	const traderStream = await traderPaired.getPastEvents(
		'Trader',
		{
			filter: {},
			fromBlock: 0
		}
	)
	const allTraders = traderStream.map((event) => {
		return {
			user: event.returnValues['trader']
		}
	})
	console.log('Traders', allTraders)
	dispatch(tradersLoaded(allTraders))
}

export const joinAsTrader = async (account, traderPaired, dispatch) => {
	try {
		traderPaired.methods.joinAsTrader().send({from: account})
		.on('transactionHash', (hash) => {
			dispatch(traderJoining())
		})
		.on('receipt', async (receipt) => {

			const trader = await traderPaired.methods.traders(account).call()

			if (trader.user !== ZERO_ADDRESS) {
				dispatch(traderLoaded(trader))
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

export const joinAsInvestor = async (account, traderPaired, dispatch) => {
	try {
		traderPaired.methods.joinAsInvestor().send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(investorJoining())
		})
		.on('receipt', async (receipt) => {

			const investor = await traderPaired.methods.investors(account).call()

			if (investor.user !== ZERO_ADDRESS) {
				dispatch(investorLoaded(investor))
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
		console.log("createWallet", account)
		traderPaired.methods.createInvestment().send({from: account})
		.on('transactionHash', async (hash) => {
			
		})
		.on('receipt', async (receipt) => {
			console.log("createWallet R", receipt)
			loadWallet(account, walletFactory, web3, dispatch)
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

export const loadWallet = async (account, walletFactory, web3, dispatch) => {
	let wallet = null
	console.log("loadWallet", account)
	const wallets = await walletFactory.methods.getInstantiations(account).call()
	console.log("W", wallets)
	if (wallets.length > 0) {
		wallet = await new web3.eth.Contract(MultiSigFundWallet.abi, wallets[0], {handleRevert: true})
	}
	
	dispatch(walletLoaded(wallet))
}

export const loadInvestorInvestments = async (investor, traderPaired, pairedInvestments, dispatch) => {
	let investments = []

	// 1 based
	for (let i=1; i<=investor.investmentCount; i++) {
		const investmentId = await traderPaired.investorInvestments(investor.user, i).call()
		let investment = await pairedInvestments.investments(investmentId).call()

		investment.amount = new BigNumber(investment.amount)
		investment.value = new BigNumber(investment.value)

		investments = investments.concat(investment)
	}

	dispatch(investorInvestmentsLoaded(investments))
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

// export const subscribeTotTaderPairedEvents = async (traderPaired, dispatch) => {
// 	traderPaired.events.ProjectStarted({}, (error, event) => {
// 		dispatch(projectStarted(event.returnValues))
// 	})
// }
