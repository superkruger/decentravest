import Web3 from 'web3'
import axios from 'axios'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import TraderPaired from '../abis/TraderPaired.json'
import PairedInvestments from '../abis/PairedInvestments.json'
import MultiSigFundWalletFactory from '../abis/MultiSigFundWalletFactory.json'
import MultiSigFundWallet from '../abis/MultiSigFundWallet.json'
import ERC20 from '../abis/IERC20.json'
import { log, ZERO_ADDRESS, INVESTMENT_COLLATERAL, INVESTMENT_DIRECT, INVESTMENT_STATE_INVESTED, setTokens, userTokens, toBN, etherToWei, tokenAddressForSymbol, tokenSymbolForAddress, info, fail } from '../helpers'
import {
	ethereumInstalled,
	notificationAdded,
	notificationRemoved,
	web3Loaded,
	networkJoined,
	web3AccountLoaded,
	traderPairedLoaded,
	pairedInvestmentsLoaded,
	adminLoaded,
	tokensLoaded,
	balanceLoaded,
	traderLoaded,
	settingProfit,
	profitPercentagesLoaded,
	mainTraderLoaded,
	mainInvestorLoaded,
	joining,
	traderAllocationLoaded,
	allocating,
	walletFactoryLoaded,
	walletCreating,
	mainWalletLoaded,
	mainWalletBalanceLoaded,
	investmentLoaded,
	investing,
	investmentChanging,
	disbursementCreated,
	traderStatisticsLoaded,
	investorStatisticsLoaded,
	tradeCountLoaded,
	tradeLoaded
} from './actions.js'

export const checkEthereum = (dispatch) => {
	if (typeof window.ethereum !== 'undefined') {
		dispatch(ethereumInstalled())
	}
}

export const loadWebApp = async (dispatch) => {

  	let web3 = new Web3(window.ethereum)
	await window.ethereum.request({ method: 'eth_requestAccounts' })

	window.ethereum.on('accountsChanged', async function (accounts) {
		document.location = "/"
	})

	window.ethereum.on('chainChanged', () => {
		document.location = "/"
	})

	if (web3) {
		web3.eth.handleRevert = true

		await web3.eth.net.getNetworkType()
		const networkId = await web3.eth.net.getId()
		console.log("networkId", networkId)
		const account = await loadAccount(web3, dispatch)

		let network

		switch (networkId) {
			case 1:
				network = "MAINNET"
				break
			case 3:
				network = "ROPSTEN"
				break
			default:
				network = "DEV"
		}

		console.log("network", network)

		setTokens(network)
		dispatch(networkJoined(network))

		const traderPaired = await loadTraderPaired(network, account, web3, networkId, dispatch)
		if(!traderPaired) {
			dispatch(notificationAdded(fail("Contracts", "Smart contract not detected on the current network. Please select the mainnet on Metamask.")))
			console.log('Smart contract not detected on the current network. Please select the mainnet on Metamask.')
			return
		}

		dispatch(web3Loaded(web3))
	}
	else {
		dispatch(notificationAdded(fail("Web3", "Could not load Web3. Have you installed Metamask?")))
	}
	return web3
}

const loadAccount = async (web3, dispatch) => {
	const accounts = await web3.eth.getAccounts()
	const account = accounts[0]
	dispatch(web3AccountLoaded(account))
	return account
}

export const loadBalances = async (account, traderPaired, tokens, web3, dispatch) => {

	try {
		const etherBalance = await web3.eth.getBalance(account)
		dispatch(balanceLoaded({amount: new BigNumber(etherBalance), symbol: "ETH"}))
	} catch (error) {
		log("etherBalance error", error)
	}

	tokens.forEach(async (token) => {
		try {
			const tokenBalance = await token.contract.methods.balanceOf(account).call()
			dispatch(balanceLoaded({amount: new BigNumber(tokenBalance), symbol: token.symbol}))
		} catch (error) {
			log(`tokenBalance ${token.symbol} error`, error)
		}
	})
}

export const loadMainWalletBalances = async (wallet, tokens, dispatch) => {

	try {
		const etherBalance = await wallet.methods.etherBalance().call()
		dispatch(mainWalletBalanceLoaded({amount: new BigNumber(etherBalance), symbol: "ETH"}))
	} catch (error) {
		log("etherBalance error", error)
	}
	tokens.forEach(async (token) => {
		try {
			const tokenBalance = await wallet.methods.tokenBalance(token.contract.options.address).call()
			dispatch(mainWalletBalanceLoaded({amount: new BigNumber(tokenBalance), symbol: token.symbol}))
		} catch (error) {
			log(`tokenBalance ${token.symbol} error`, error)
		}
	})
}

const loadTraderPaired = async (network, account, web3, networkId, dispatch) => {
	try {
		log("loadTraderPaired", TraderPaired)
		if (TraderPaired.networks[networkId] !== undefined) {
			log("TraderPaired address: ", TraderPaired.networks[networkId].address)
			const traderPaired = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})

			const pairedInvestments = await new web3.eth.Contract(PairedInvestments.abi, PairedInvestments.networks[networkId].address, {handleRevert: true})
			dispatch(pairedInvestmentsLoaded(pairedInvestments))

			const walletFactory = await new web3.eth.Contract(MultiSigFundWalletFactory.abi, MultiSigFundWalletFactory.networks[networkId].address, {handleRevert: true})
			dispatch(walletFactoryLoaded(walletFactory))

			const daiToken = await new web3.eth.Contract(ERC20.abi, process.env['REACT_APP_'+network+'_DAI_ADDRESS'], {handleRevert: true})
			const usdcToken = await new web3.eth.Contract(ERC20.abi, process.env['REACT_APP_'+network+'_USDC_ADDRESS'], {handleRevert: true})

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

			loadTraders(network, traderPaired, dispatch)
			dispatch(traderPairedLoaded(traderPaired))

			const trader = await traderPaired.methods.traders(account).call()
			const investor = await traderPaired.methods.investors(account).call()

			if (trader && trader.user !== ZERO_ADDRESS) {
				await loadMainTrader(network, trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
			}

			if (investor && investor.user !== ZERO_ADDRESS) {
				await loadMainInvestor(network, investor, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
			}

			if (account === process.env['REACT_APP_'+network+'_FACC']) {
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

const loadMainTrader = async (network, trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {
	await loadTraderInvestments(network, trader.user, web3, dispatch)
	await loadTraderAllocations(network, trader.user, traderPaired, dispatch)

	dispatch(mainTraderLoaded(trader))
}

const loadMainInvestor = async (network, investor, traderPaired, pairedInvestments, walletFactory, web3, dispatch) => {
	await loadInvestorInvestments(network, investor.user, web3, dispatch)
	await loadMainWallet(investor.user, walletFactory, web3, dispatch)
	
	dispatch(mainInvestorLoaded(investor))
}

const loadAdmin = async (admin, traderPaired, dispatch) => {
	// await loadInvestors(investor, traderPaired, pairedInvestments, dispatch)
	
	dispatch(adminLoaded())
}

const loadTraders = async (network, traderPaired, dispatch) => {

	const traderCount = await traderPaired.methods.traderCount().call()
	for (let i = 1; i <= traderCount; i++) {
		const traderAddress = await traderPaired.methods.traderAddresses(i).call()
		const trader = await traderPaired.methods.traders(traderAddress).call()
		dispatch(traderLoaded(mapTrader(trader)))
		await loadTraderAllocations(network, trader.user, traderPaired, dispatch)
	}

	traderPaired.events.Trader({filter: {}}, (err, event) => {
		loadTraderAllocations(network, event.returnValues.user, traderPaired, dispatch)
		dispatch(traderLoaded(mapTrader(event.returnValues)))
	})

	traderPaired.events.ProfitPercentages({filter: {}}, (err, event) => {
		dispatch(profitPercentagesLoaded(mapProfitPercentages(event.returnValues)))
	})
}

export const setProfitPercentages = async (account, collateralPercentage, directPercentage, traderPaired, dispatch) => {
	try {
		log("setProfitPercentages", account, collateralPercentage, directPercentage)

		let collateralNum = new Number(collateralPercentage)
		let directNum = new Number(directPercentage)

		if (collateralNum < 1 || collateralNum > 99 || directNum < 1 || directNum > 99) {
			dispatch(notificationAdded(fail("Profit", "Percentages must be between 1 and 99")))
			return
		}

		dispatch(settingProfit(true))
		traderPaired.methods.setProfitPercentages(collateralNum * 100, directNum * 100).send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Profit", "Setting profit percentages...", hash)))
		})
		.on('receipt', async (receipt) => {
			log("receipt", receipt)
			dispatch(settingProfit(false))
			dispatch(notificationRemoved(receipt.transactionHash))
			dispatch(notificationAdded(info("Profit", "Profit percentages set")))
		})
		.on('error', (err) => {
			dispatch(settingProfit(false))
			log('Could not setProfitPercentages', err)
			dispatch(notificationAdded(fail("Profit", "Could not profit percentages")))
		})
	} catch (err) {
			dispatch(settingProfit(false))
		log('Could not setProfitPercentages', err)
	}
}

const loadTraderInvestments = async (network, account, web3, dispatch) => {

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_INVESTMENTS']
		
		if (network === 'DEV') {
			url = url + "/trader/$1.json"
		} else {
			url = url + "?trader=$1"
		}

		url = url.replace('$1', account)

		log("loadTraderInvestments", url)

		const response = await axios.get(url)
	    const investments = response.data

	    investments.forEach(async (investment) => {
	    	const inv = await mapInvestment(investment, web3)
	    	dispatch(investmentLoaded(inv))
	    })

	} catch (error) {
		log('Could not get trader investments', error)
	}
}

export const joinAsTrader = async (network, account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history) => {
	log('joinAsTrader', network, account)
	try {
		dispatch(joining(true))
		traderPaired.methods.joinAsTrader().send({from: account})
		.on('transactionHash', (hash) => {
			dispatch(notificationAdded(info("Trader", "Joining as trader...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))

			await traderJoined(network, account)

			const trader = await traderPaired.methods.traders(account).call()

			if (trader.user !== ZERO_ADDRESS) {
				await loadMainTrader(network, trader, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
				dispatch(notificationAdded(info("Trader", "Successfully registered as a trader!")))
				history.push('trader_dashboard')
			}
			dispatch(joining(false))
		})
		.on('error', (err) => {
			log('Could not joinAsTrader', err)
			dispatch(joining(false))
			dispatch(notificationAdded(fail("Trader", "Could not join as trader")))
		})
	} catch (err) {
		dispatch(joining(false))
		log('Could not joinAsTrader', err)
		return null
	}
}

export const joinAsInvestor = async (network, account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history) => {
	try {
		dispatch(joining(true))
		traderPaired.methods.joinAsInvestor().send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Investor", "Joining as investor...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))

			await investorJoined(network, account)

			const investor = await traderPaired.methods.investors(account).call()

			if (investor.user !== ZERO_ADDRESS) {
				await loadMainInvestor(network, investor, traderPaired, pairedInvestments, walletFactory, web3, dispatch)
				dispatch(notificationAdded(info("Investor", "Successfully registered as an investor")))
				history.push('investor_dashboard')
			}
			dispatch(joining(false))
		})
		.on('error', (err) => {
			dispatch(joining(false))
			log('Could not joinAsInvestor', err)
			dispatch(notificationAdded(fail("Investor", "Could not join as investor")))
		})
	} catch (err) {
		dispatch(joining(false))
		log('Could not joinAsInvestor', err)
		return null
	}
}


export const loadTraderAllocations = async (network, account, traderPaired, dispatch) => {
	try {
		// Current allocations

		// ETH
		let tokenAllocation = await traderPaired.methods.allocations(account, ZERO_ADDRESS).call()
		tokenAllocation.token = ZERO_ADDRESS
		dispatch(traderAllocationLoaded(account, mapAllocation(tokenAllocation)))

		// DAI
		tokenAllocation = await traderPaired.methods.allocations(account, process.env['REACT_APP_'+network+'_DAI_ADDRESS']).call()
		tokenAllocation.token = process.env['REACT_APP_'+network+'_DAI_ADDRESS']
		dispatch(traderAllocationLoaded(account, mapAllocation(tokenAllocation)))

		// USDC
		tokenAllocation = await traderPaired.methods.allocations(account, process.env['REACT_APP_'+network+'_USDC_ADDRESS']).call()
		tokenAllocation.token = process.env['REACT_APP_'+network+'_USDC_ADDRESS']
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
		dispatch(allocating(true, tokenAddress))
		log("setTraderAllocation", tokenAddress, amount.toString(), decimals)

		traderPaired.methods.allocate(tokenAddress, toBN(etherToWei(amount, decimals))).send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Allocation", "Setting allocation...", hash)))
		})
		.on('receipt', async (receipt) => {
			log("receipt", receipt)
			dispatch(allocating(false, tokenAddress))
			dispatch(notificationRemoved(receipt.transactionHash))
			dispatch(notificationAdded(info("Allocation", "Allocation set")))
		})
		.on('error', (err) => {
			dispatch(allocating(false, tokenAddress))
			log('Could not setTraderAllocation', err)
			dispatch(notificationAdded(fail("Allocation", "Could not set allocation")))
		})
	} catch (err) {
		dispatch(allocating(false, tokenAddress))
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

const loadInvestorInvestments = async (network, account, web3, dispatch) => {

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_INVESTMENTS']
		
		if (network === 'DEV') {
			url = url + "/investor/$1.json"
		} else {
			url = url + "?investor=$1"
		}

		url = url.replace('$1', account)

		log("loadInvestorInvestments", url)

		const response = await axios.get(url)
	    const investments = response.data

	    investments.forEach(async (investment) => {
	    	let inv = await mapInvestment(investment, web3)
	    	dispatch(investmentLoaded(inv))
	    })

	} catch (error) {
		log('Could not get trader investments', error)
	}
}

export const invest = async (network, account, trader, tokenAddress, token, amount, wallet, investmentType, web3, dispatch) => {
	try {
		const isTrader = await wallet.methods.traders(trader).call()
		if (!isTrader) {
			dispatch(investing(true, trader, tokenAddress, investmentType, "You'll be asked to confirm adding the trader to your wallet"))
			wallet.methods.setTrader(trader, true).send({from: account})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Adding trader to wallet...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				await investInTrader(network, account, trader, tokenAddress, token, amount, wallet, investmentType, web3, dispatch)
			})
			.on('error', (err) => {
				dispatch(investing(false, trader, tokenAddress, investmentType))
				log('Could not invest', err)
				dispatch(notificationAdded(fail("Investment", "Could not add trader to wallet")))
			})
		} else {
			await investInTrader(network, account, trader, tokenAddress, token, amount, wallet, investmentType, web3, dispatch)
		}
		
	} catch (err) {
		dispatch(investing(false, trader, tokenAddress, investmentType))
		log('Could not invest', err)
		return null
	}
}

const investInTrader = async (network, account, trader, tokenAddress, token, amount, wallet, investmentType, web3, dispatch) => {
	try {
		if (tokenAddress === ZERO_ADDRESS) {
			dispatch(investing(true, trader, tokenAddress, investmentType, "You'll be asked to confirm the investment amount plus gas fees"))
		
			wallet.methods.fundEther(trader, investmentType).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Investing ether...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(investing(false, trader, tokenAddress, investmentType))
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Invested ether")))

				let investmentId = receipt.events.Fund.returnValues.investmentId
				// don't have to wait
				createdInvestment(network, investmentId, web3, dispatch)
			})
			.on('error', (err) => {
				log('Could not fundEther', err)
				dispatch(investing(false, trader, tokenAddress, investmentType))
				dispatch(notificationAdded(fail("Investment", "Could not invest ether")))
			})
		} else {
			dispatch(investing(true, trader, tokenAddress, investmentType, "You'll be asked to approve wallet access to the token"))
		
			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Aproving tokens...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(investing(true, trader, tokenAddress, investmentType, "You'll be asked to confirm the investment amount plus gas fees"))
		
				dispatch(notificationRemoved(receipt.transactionHash))
				wallet.methods.fundToken(trader, token.contract.options.address, amount, investmentType).send({from: account})
				.on('transactionHash', async (hash) => {
					dispatch(notificationAdded(info("Investment", "Investing tokens...", hash)))
				})
				.on('receipt', async (receipt) => {
					dispatch(investing(false, trader, tokenAddress, investmentType))
					dispatch(notificationRemoved(receipt.transactionHash))
					dispatch(notificationAdded(info("Investment", "Invested tokens")))

					let investmentId = receipt.events.Fund.returnValues.investmentId
					// don't have to wait
					createdInvestment(network, investmentId, web3, dispatch)
				})
				.on('error', (err) => {
					log('Could not fundToken', err)
					dispatch(investing(false, trader, tokenAddress, investmentType))
					dispatch(notificationAdded(fail("Investment", "Could not invest token")))
				})
			})
			.on('error', (err) => {
				log('Could not approve token', err)
				dispatch(investing(false, trader, tokenAddress, investmentType))
				dispatch(notificationAdded(fail("Investment", "Could not approve token amount")))
			})
		}
		
	} catch (err) {
		dispatch(investing(false, trader, tokenAddress, investmentType))
		log('Could not investInTrader', err)
		return null
	}
}

export const stopInvestment = async (network, account, investment, wallet, web3, dispatch) => {
	try {
		dispatch(investmentChanging(investment, true, "You'll need to confirm stopping the investment"))

		wallet.methods.stop(investment.trader, investment.id).send({from: account})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Stopping investment...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Stopped investment")))

				// don't have to wait
				stoppedInvestment(network, investment.id, web3, dispatch)
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

export const disburseInvestment = async (network, account, investment, wallet, token, pairedInvestments, web3, dispatch) => {
	try {
		let profitsAndFees = await pairedInvestments.methods.calculateProfitsAndFees(toBN(investment.grossValue), toBN(investment.amount), 100, 100, toBN(investment.investorProfitPercent)).call()
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
		log("disburseInvestment amount", amount.toString())

		if (investment.token === ZERO_ADDRESS) {
			dispatch(investmentChanging(investment, true, "You'll need to confirm disbursing the investment"))
		
			wallet.methods.disburseEther(investment.trader, investment.id, toBN(investment.grossValue)).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Requesting disbursement...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Disbursement requested")))

				// don't have to wait
				exitRequested(network, investment.id, web3, dispatch)
			})
			.on('error', (err) => {
				log('Could not disburseInvestment', err)
				dispatch(investmentChanging(investment, false))
				dispatch(notificationAdded(fail("Investment", "Could not request disbursement")))
			})
		} else {
			dispatch(investmentChanging(investment, true, "You'll need to approve wallet access to the token"))

			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Approving tokens...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(investmentChanging(investment, true, "You'll need to confirm disbursing the investment"))
				dispatch(notificationRemoved(receipt.transactionHash))

				wallet.methods.disburseToken(investment.trader, investment.id, investment.token, toBN(investment.grossValue), amount).send({from: account})
				.on('transactionHash', async (hash) => {
					dispatch(notificationAdded(info("Investment", "Requesting disbursement...", hash)))
				})
				.on('receipt', async (receipt) => {
					dispatch(notificationRemoved(receipt.transactionHash))
					dispatch(notificationAdded(info("Investment", "Disbursement requested")))

					// don't have to wait
					exitRequested(network, investment.id, web3, dispatch)
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

export const approveDisbursement = async (network, account, investment, wallet, token, pairedInvestments, web3, dispatch) => {
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

		if (investment.token === ZERO_ADDRESS) {
			dispatch(investmentChanging(investment, true, "You'll need to confirm approving the disbursement"))
		
			wallet.methods.approveDisbursementEther(investment.trader, investment.disbursementId).send({from: account, value: amount})
			.on('transactionHash', async (hash) => {
				dispatch(notificationAdded(info("Investment", "Approving disbursement...", hash)))
			})
			.on('receipt', async (receipt) => {
				dispatch(notificationRemoved(receipt.transactionHash))
				dispatch(notificationAdded(info("Investment", "Disbursement approved")))

				// don't have to wait
				exitApproved(network, investment.id, web3, dispatch)
			})
			.on('error', (err) => {
				log('Could not approveDisbursement', err)
				dispatch(investmentChanging(investment, false))
				dispatch(notificationAdded(fail("Investment", "Could not approve disbursement")))
			})
		} else {
			dispatch(investmentChanging(investment, true, "You'll need to approve wallet access to the token"))

			token.contract.methods.approve(wallet.options.address, amount).send({from: account})
			.on('transactionHash', async (hash) => {
			})
			.on('receipt', async (receipt) => {
				wallet.methods.approveDisbursementToken(investment.trader, investment.disbursementId, investment.token, amount).send({from: account})
				.on('transactionHash', async (hash) => {
					dispatch(notificationAdded(info("Investment", "Approving disbursement...", hash)))
				})
				.on('receipt', async (receipt) => {
					dispatch(investmentChanging(investment, true, "You'll need to confirm approving the disbursement"))
					dispatch(notificationRemoved(receipt.transactionHash))
					dispatch(notificationAdded(info("Investment", "Disbursement approved")))

					// don't have to wait
					exitApproved(network, investment.id, web3, dispatch)
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

export const rejectDisbursement = async (network, account, investment, wallet, pairedInvestments, web3, dispatch) => {
	try {
		log("reject disburseInvestment", account, investment.trader, investment.disbursementId, toBN(investment.grossValue))

		dispatch(investmentChanging(investment, true, "You'll need to confirm rejecting the disbursement"))
		wallet.methods.rejectDisbursement(investment.trader, investment.disbursementId, investment.token, toBN(investment.grossValue)).send({from: account})
		.on('transactionHash', async (hash) => {
			dispatch(notificationAdded(info("Investment", "Rejecting disbursement...", hash)))
		})
		.on('receipt', async (receipt) => {
			dispatch(notificationRemoved(receipt.transactionHash))
			dispatch(notificationAdded(info("Investment", "Disbursement rejected")))

			// don't have to wait
			exitRejected(network, investment.id, web3, dispatch)
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
		investorCollateralProfitPercent: new BigNumber(event.investorCollateralProfitPercent).dividedBy(100),
		investorDirectProfitPercent: new BigNumber(event.investorDirectProfitPercent).dividedBy(100),
		date: moment.unix(event.date).utc()
	}
}

const mapProfitPercentages = (event) => {
	return {
		...event,
		investorCollateralProfitPercent: new BigNumber(event.investorCollateralProfitPercent).dividedBy(100),
		investorDirectProfitPercent: new BigNumber(event.investorDirectProfitPercent).dividedBy(100)
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

const mapInvestment = async (investment, web3) => {
	const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, investment.wallet, {handleRevert: true})

	return {
		...investment,
		amount: new BigNumber(investment.amount),
		value: new BigNumber(investment.value),
		grossValue: new BigNumber(investment.grossValue),
		nettValue: new BigNumber(investment.nettValue),
		investorProfitPercent: new BigNumber(investment.investorProfitPercent),
		investmentType: parseInt(investment.investmentType, 10),
		start: moment.unix(investment.startDate).utc(),
		end: moment.unix(investment.endDate).utc(),
		startUnix: investment.startDate,
		endUnix: investment.endDate,
		walletContract: walletContract
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
		requestFrom: event.from,
		requestExitDate: moment.unix(event.date).utc(),
		state: state
	}
}

const mapApproveExit = (event) => {
	return {
		...event,
		approveFrom: event.from,
		approveExitDate: moment.unix(event.date).utc(),
		state: "4"
	}
}

const mapRejectExit = (event) => {
	return {
		...event,
		rejectValue: new BigNumber(event.value),
		rejectFrom: event.from,
		rejectExitDate: moment.unix(event.date).utc(),
		state: "1"
	}
}

const mapTrade = (trade) => {
	return {
		...trade,
		start: moment.unix(trade.start),
		end: moment.unix(trade.end),
		profit: new BigNumber(trade.profit),
		initialAmount: new BigNumber(trade.initialAmount)
	}
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

const getTradeInvestmentsAmount = async (trade, traderInvestments) => {
	let investments = traderInvestments.filter((investment) => tokenAddressForSymbol(trade.asset) === investment.token)
	
	investments = investments.filter(investment =>
		trade.start.isAfter(investment.start) 
			&& (
				(investment.end.unix() === 0 || investment.state === INVESTMENT_STATE_INVESTED) 
					|| trade.end.isBefore(investment.end)))
	
	let totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), new BigNumber(0))
	return totalAmount
}

export const loadTraderStatistics = async (account, network, dispatch) => {
	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_STATISTICS']

		if (network === 'DEV') {
			url = url + "/trader/$1.json"
		} else {
			url = url + "?trader=$1"
		}

		url = url.replace('$1', account)

		console.log("loadTraderStatistics", url)
		const response = await axios.get(url)
		dispatch(traderStatisticsLoaded(account, response.data))

	} catch (error) {
		log('Could not get statistics', error)
	}
}

export const loadInvestorStatistics = async (account, network, dispatch) => {
	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_STATISTICS']
		
		if (network === 'DEV') {
			url = url + "/investor/$1.json"
		} else {
			url = url + "?investor=$1"
		}

		url = url.replace('$1', account)

		console.log("loadInvestorStatistics", url)
		const response = await axios.get(url)
		dispatch(investorStatisticsLoaded(account, response.data))

	} catch (error) {
		log('Could not get statistics', error)
	}
}

export const loadTradeCount = async (network, account, dispatch) => {
	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_TRADES']
		url = url.replace('$1', account)

		const response = await axios.get(url)
		dispatch(tradeCountLoaded(response.data.length))
		  
		return true
	} catch (error) {
		log('Could not get trades', error)
		return false
	}
}

export const traderJoined = async (network, account) => {
	log("traderJoined", network, account)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/traderJoined/$1.json"
			url = url.replace('$1', account)
			response = await axios.get(url)
		} else {
			const data = {action: 'traderJoined', trader: account}
			response = await axios.post(url, JSON.stringify(data))
		}
	    return true

	} catch (error) {
		log('Could not join trader', error)
		return false
	}
}

export const investorJoined = async (network, account) => {
	log("investorJoined", network, account)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/investorJoined/$1.json"
			url = url.replace('$1', account)
			response = await axios.get(url)
		} else {
			const data = {action: 'investorJoined', investor: account}
			response = await axios.post(url, JSON.stringify(data))
		}
	    return true

	} catch (error) {
		log('Could not join investor', error)
		return false
	}
}

export const createdInvestment = async (network, investmentId, web3, dispatch) => {
	log("createdInvestment", network, investmentId)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/createdInvestment/$1.json"
			url = url.replace('$1', investmentId)
			response = await axios.get(url)
		} else {
			const data = {action: 'createdInvestment', investmentId: investmentId}
			response = await axios.post(url, JSON.stringify(data))
		}
	    const investment = await mapInvestment(response.data, web3)

	    dispatch(investmentLoaded(investment))

	    return true

	} catch (error) {
		log('Could not create investment', error)
		return false
	}
}

export const stoppedInvestment = async (network, investmentId, web3, dispatch) => {
	log("stoppedInvestment", network, investmentId)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/stoppedInvestment/$1.json"
			url = url.replace('$1', investmentId)
			response = await axios.get(url)
		} else {
			const data = {action: 'stoppedInvestment', investmentId: investmentId}
			response = await axios.post(url, JSON.stringify(data))
		}
	    const investment = await mapInvestment(response.data, web3)

	    dispatch(investmentLoaded(investment))

	    return true

	} catch (error) {
		log('Could not stop investment', error)
		return false
	}
}

export const exitRequested = async (network, investmentId, web3, dispatch) => {
	log("exitRequested", network, investmentId)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/exitRequested/$1.json"
			url = url.replace('$1', investmentId)
			response = await axios.get(url)
		} else {
			const data = {action: 'exitRequested', investmentId: investmentId}
			response = await axios.post(url, JSON.stringify(data))
		}
	    const investment = await mapInvestment(response.data, web3)

	    dispatch(investmentLoaded(investment))

	    return true

	} catch (error) {
		log('Could not request exit', error)
		return false
	}
}

export const exitRejected = async (network, investmentId, web3, dispatch) => {
	log("exitRejected", network, investmentId)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/exitRejected/$1.json"
			url = url.replace('$1', investmentId)
			response = await axios.get(url)
		} else {
			const data = {action: 'exitRejected', investmentId: investmentId}
			response = await axios.post(url, JSON.stringify(data))
		}
	    const investment = await mapInvestment(response.data, web3)

	    dispatch(investmentLoaded(investment))

	    return true

	} catch (error) {
		log('Could not reject exit', error)
		return false
	}
}

export const exitApproved = async (network, investmentId, web3, dispatch) => {
	log("exitApproved", network, investmentId)

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_USERACTION']

		let response

		if (network === 'DEV') {
			url = url + "/exitApproved/$1.json"
			url = url.replace('$1', investmentId)
			response = await axios.get(url)
		} else {
			const data = {action: 'exitApproved', investmentId: investmentId}
			response = await axios.post(url, JSON.stringify(data))
		}
	    const investment = await mapInvestment(response.data, web3)

	    dispatch(investmentLoaded(investment))

	    return true

	} catch (error) {
		log('Could not approve exit', error)
		return false
	}
}

export const loadTrades = async (network, account, dispatch) => {
	log("loadTrades", network, account)

	try {
		let trades = await getTrades(network, account)

		trades.forEach((trade, index) => dispatch(tradeLoaded(trade)))
		return true

	} catch (error) {
		log('Could not get trader trades', error)
		return false
	}
}

export const getTrades = async (network, account) => {

	try {
		let url = process.env['REACT_APP_' + network + '_API_BASE'] + 
					process.env['REACT_APP_' + network + '_API_TRADES']
		url = url.replace('$1', account)

		console.log("getTrades", url)

		const response = await axios.get(url)
	    return response.data.map(mapTrade)
	} catch (error) {
		log('Could not get trades', error)
	}

	return []
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

