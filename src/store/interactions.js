import Web3 from 'web3'
import TraderPaired from '../abis/TraderPaired.json'
import { 
	web3Loaded,
	web3AccountLoaded,
	crowdvestLoaded,
	traderLoaded,
	investorLoaded
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

export const loadCrowdvest = async (account, web3, networkId, dispatch) => {
	try {

		console.log("TraderPaired address: ", TraderPaired.networks[networkId].address)
		const crowdvest = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})

		const trader = await crowdvest.methods.traders(account).call()
		const investor = await crowdvest.methods.investors(account).call()

		if (trader.id !== 0) {
			dispatch(traderLoaded(trader))
		}
		if (investor.id !== 0) {
			dispatch(investorLoaded(investor))
		}

		dispatch(crowdvestLoaded(crowdvest))
		return crowdvest
	} catch (error) {
		console.log('Contract not deployed to the current network', error)
		return null
	}
}

export const joinAsTrader = async (account, crowdvest, dispatch) => {
	try {
		crowdvest.methods.joinAsTrader(8000).send({from: account})
		.on('transactionHash', (hash) => {
		})
		.on('error', (error) => {
			console.log('Could not joinAsTrader', error)
		})
	} catch (error) {
		console.log('Could not joinAsTrader', error)
		return null
	}
}

export const joinAsInvestor = async (account, crowdvest, dispatch) => {
	try {
		crowdvest.methods.joinAsInvestor().send({from: account})
		.on('transactionHash', (hash) => {
		})
		.on('error', (error) => {
			console.log('Could not joinAsInvestor', error)
		})
	} catch (error) {
		console.log('Could not joinAsInvestor', error)
		return null
	}
}

// export const subscribeToCrowdVestEvents = async (crowdsale, dispatch) => {
// 	crowdsale.events.ProjectStarted({}, (error, event) => {
// 		dispatch(projectStarted(event.returnValues))
// 	})
// }

// export const subscribeToProjectEvents = async (project, account, crowdsale, web3, dispatch) => {
// 	project.events.FundingReceived({}, (error, event) => {
// 		dispatch(fundingReceived(event.returnValues))
// 	})
// 	project.events.CreatorPaid({}, (error, event) => {
// 		dispatch(creatorPaid(event.returnValues))
// 	})
// }