import Web3 from 'web3'
import TraderPaired from '../abis/TraderPaired.json'
import { ZERO_ADDRESS } from '../helpers'
import { 
	web3Loaded,
	web3AccountLoaded,
	traderPairedLoaded,
	traderLoaded,
	investorLoaded,
	traderJoining
} from './actions.js'

export const loadWeb3 = (dispatch) => {
	let web3 = new Web3(window['ethereum'] || Web3.givenProvider || 'http://127.0.0.1:8545')
	web3.eth.handleRevert = true
	dispatch(web3Loaded(web3))
	return web3
}

export const loadAccount = async (web3, dispatch) => {
	const accounts = await web3.eth.getAccounts()
	const account = accounts[0]
	dispatch(web3AccountLoaded(account))
	return account
}

export const loadTraderPaired = async (account, web3, networkId, dispatch) => {
	try {
		if (TraderPaired.networks[networkId] !== undefined) {
			console.log("TraderPaired address: ", TraderPaired.networks[networkId].address)
			const traderPaired = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})

			const trader = await traderPaired.methods.traders(account).call()
			console.log('Trader', trader)
			// const investor = await traderPaired.methods.investors(account).call()
			// console.log('Investor', investor)

			if (trader && trader.user !== ZERO_ADDRESS) {
				dispatch(traderLoaded(trader))
			}
			// if (investor && investor.user !== ZERO_ADDRESS) {
			// 	dispatch(investorLoaded(investor))
			// }

			dispatch(traderPairedLoaded(traderPaired))
			return traderPaired
		}
	} catch (error) {
		console.log('Contract not deployed to the current network', error)
	}
	return null
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
			
		})
		.on('receipt', async (receipt) => {

			const investor = await traderPaired.methods.investors(account).call()

			if (investor.user !== ZERO_ADDRESS) {
				dispatch(investorLoaded(investor))
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

// export const subscribeTotTaderPairedEvents = async (traderPaired, dispatch) => {
// 	traderPaired.events.ProjectStarted({}, (error, event) => {
// 		dispatch(projectStarted(event.returnValues))
// 	})
// }
