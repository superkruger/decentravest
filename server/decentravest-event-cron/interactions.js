const Web3 = require("web3")
const BigNumber = require('bignumber.js')
const moment = require('moment')
const axios = require('axios')

const TraderPaired = require('./abis/TraderPaired.json')
const MultiSigFundWallet = require('./abis/MultiSigFundWallet.json')

const traderDao = require('./dao/traderpaired/trader')
const investorDao = require('./dao/traderpaired/investor')
const investDao = require('./dao/traderpaired/invest')
const requestExitDao = require('./dao/traderpaired/requestExit')
const rejectExitDao = require('./dao/traderpaired/rejectExit')
const approveExitDao = require('./dao/traderpaired/approveExit')
const allocateDao = require('./dao/traderpaired/allocate')
const stopDao = require('./dao/traderpaired/stop')
const disbursementCreatedDao = require('./dao/multisigfundwallet/disbursementCreated')

const positionsHandler = require('./dydx/positions')

const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')

const investmentsDao = require('./dao/investments')
const investmentsController = require('./controller/investments')

const statisticsHandler = require('./statistics')

const tradesController = require('./controller/trades')
const statisticsController = require('./controller/statistics')

const helpers = require('./helpers')

const loadWeb3 = async () => {
	console.log('loadWeb3, making axios request');

	try {
		let response = await axios.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY')
	
		console.log("axios success", response.data.url)
		console.log("axios success", response.data.explanation)
	} catch(error) {
		console.log("axios error", error)
	}

	console.log('INFURA_BASE_URL: ', process.env.INFURA_BASE_URL);
	console.log('INFURA_API_KEY: ', process.env.INFURA_API_KEY);
	
	let web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.INFURA_BASE_URL}.infura.io/v3/${process.env.INFURA_API_KEY}`));
	// web3 = new Web3(Web3.givenProvider || 'http://127.0.0.1:8545')
	console.log("web3", web3);

	if (web3) {
		let networkType = await web3.eth.net.getNetworkType()
		console.log("networkType", networkType)
		let networkId = await web3.eth.net.getId()
		console.log("networkId", networkId)

		return {web3, networkId}
	} else {
		console.log("could not load web3")
	}
	return null
}
exports.loadWeb3 = loadWeb3

const loadTraderPaired = async (web3, networkId) => {
	try {
		if (TraderPaired.networks[networkId] !== undefined) {
			console.log("TraderPaired address: ", TraderPaired.networks[networkId].address)
			let traderPaired = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})
			return traderPaired
		}
	} catch (error) {
		console.log('Contract not deployed to the current network', error)
	}
	return null
}
exports.loadTraderPaired = loadTraderPaired

const processEvents = async (web3, traderPaired) => {
	console.log('processEvents START')
	let lastBlock = 0;
	let result

	// Trader
	//
	let last = await traderDao.getLast();
	console.log("Trader last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("Trader blockNumber", lastBlock);

	let stream = await traderPaired.getPastEvents(
		'Trader', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Trader Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Trader", events[i])

		result = await traderDao.create(events[i]);
		if (!result) {
			return false
		}
	}

	// Investor
	//
	last = await investorDao.getLast();
	console.log("Investor last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("Investor blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'Investor', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} Investor Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Investor", events[i])

		result = await investorDao.create(events[i]);
		if (!result) {
			return false
		}
	}

	// Invest
	//
	last = await investDao.getLast();
	console.log("Invest last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("Invest blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'Invest', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} Invest Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Invest", events[i])

		let result = await investDao.create(events[i])
		if (!result) {
			return false
		}
	}

	// Stop
	//
	last = await stopDao.getLast()
	console.log("Stop last", last)
	lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Stop blockNumber", lastBlock)

	stream = await traderPaired.getPastEvents(
		'Stop', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} Stop Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Stop", events[i])

		let result = await stopDao.create(events[i])
		if (!result) {
			return false
		}
	}

	// RequestExit
	//
	last = await requestExitDao.getLast()
	console.log("RequestExit last", last)
	lastBlock = last ? last.blockNumber + 1 : 0
	console.log("RequestExit blockNumber", lastBlock)

	stream = await traderPaired.getPastEvents(
		'RequestExit', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} RequestExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RequestExit", events[i])

		let result = await requestExitDao.create(events[i])
		if (!result) {
			return false
		}

		// DisbursementCreated
		//
		// const walletAddress = events[i].returnValues.wallet

		// last = await disbursementCreatedDao.getLast(walletAddress)
		// console.log("DisbursementCreated last", last)
		// lastBlock = last ? last.blockNumber + 1 : 0
		// console.log("DisbursementCreated blockNumber", lastBlock)

		// const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, walletAddress, {handleRevert: true})

		// stream = await walletContract.getPastEvents(
		// 	'DisbursementCreated',
		// 	{
		// 		filter: {},
		// 		fromBlock: lastBlock
		// 	}
		// )
		// const walletEvents = stream.map(event => event)
		// for (let i=0; i<walletEvents.length; i++) {
		// 	console.log("DisbursementCreated", walletEvents[i])

		// 	let result = await disbursementCreatedDao.create(walletAddress, walletEvents[i])
		// 	if (!result) {
		// 		return false
		// 	}
		// }
	}

	// RejectExit
	//
	last = await rejectExitDao.getLast();
	console.log("RejectExit last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("RejectExit blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'RejectExit', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} RejectExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RejectExit", events[i])

		let result = await rejectExitDao.create(events[i])
		if (!result) {
			return false
		}
	}

	// ApproveExit
	//
	last = await approveExitDao.getLast()
	console.log("ApproveExit last", last)
	lastBlock = last ? last.blockNumber + 1 : 0
	console.log("ApproveExit blockNumber", lastBlock)

	stream = await traderPaired.getPastEvents(
		'ApproveExit', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} ApproveExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("ApproveExit", events[i])

		let result = await approveExitDao.create(events[i])
		if (!result) {
			return false
		}
	}

	// Allocate
	//
	last = await allocateDao.getLast();
	console.log("Allocate last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("Allocate blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'Allocate', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} Allocate Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Allocate", events[i])

		result = await allocateDao.create(events[i]);
		if (!result) {
			return false
		}
	}

	result = await processEventsForInvestments(web3, traderPaired)
	if (!result) {
		return false
	}

	console.log('processEvents END')
}
exports.processEvents = processEvents

const processEventsForInvestments = async (web3, traderPaired) => {
	console.log('processEventsForInvestments START')

	let result = await processInvestEventsForInvestments(traderPaired)
	if (!result) {
		return false
	}

	result = await processStopEventsForInvestments(traderPaired)
	if (!result) {
		return false
	}

	result = await processRequestExitEventsForInvestments(web3, traderPaired)
	if (!result) {
		return false
	}

	result = await processRejectExitEventsForInvestments(traderPaired)
	if (!result) {
		return false
	}

	result = await processApproveExitEventsForInvestments(traderPaired)
	if (!result) {
		return false
	}

	console.log('processEventsForInvestments END')
}

const processInvestEventsForInvestments = async (traderPaired) => {

	let last = await investmentsDao.getInvestLast();
	console.log("Investment invest last", last);
	let lastBlock = last ? last.investBlockNumber + 1 : 0;
	console.log("Investment investBlockNumber", lastBlock);

	let stream = await traderPaired.getPastEvents(
		'Invest', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Invest Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Invest", events[i])

		let investment = await investmentsController.get(events[i].returnValues.id)
		if (investment) {
			// already exists
			continue
		}
		
		let result = await investmentsController.create(events[i])
		if (!result) {
			return false
		}
	}

	return true
}

const processStopEventsForInvestments = async (traderPaired) => {

	let last = await investmentsDao.getStopLast()
	console.log("Investment stop last", last)
	let lastBlock = last ? last.stopBlockNumber + 1 : 0
	console.log("Investment stopBlockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'Stop', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Stop Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Stop", events[i])

		let investment = await investmentsController.get(events[i].returnValues.id)
		if (!investment) {
			console.error(`Could not find investment ${events[i].returnValues.id} to stop`)
			return false
		}

		if (investment.state !== helpers.INVESTMENT_STATE_INVESTED) {
			// already processed
			console.log("processStopEventsForInvestments wrong state", investment.state)
			continue
		}

		investment.stopBlockNumber = events[i].blockNumber
		investment.endDate = moment(parseInt(events[i].returnValues.date, 10))
		investment.state = helpers.INVESTMENT_STATE_STOPPED

		let result = await positionsHandler.loadTraderPositions(investment.trader)
		if (!result) {
			console.error(`Could not process trades for investment ${events[i].returnValues.id} to stop`)
			return false
		}

		investment = await statisticsController.setInvestmentValue(investment)
		if (!investment) {
			console.error(`Could not update value for investment ${events[i].returnValues.id} to stop`)
			return null
		}

		result = await investmentsController.update(investment)
		if (!result) {
			return false
		}
	}

	return true
}

const processRequestExitEventsForInvestments = async (web3, traderPaired) => {

	let last = await investmentsDao.getRequestLast()
	console.log("Investment request last", last)
	let lastBlock = last ? last.requestBlockNumber + 1 : 0
	console.log("Investment requestBlockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'RequestExit', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} RequestExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RequestExit", events[i])

		let investment = await investmentsController.get(events[i].returnValues.id)
		if (!investment) {
			console.error(`Could not find investment ${events[i].returnValues.id}`)
			return false
		}

		if (investment.state !== helpers.INVESTMENT_STATE_STOPPED) {
			// already processed
			console.log("processRequestExitEventsForInvestments wrong state", investment.state)
			continue
		}

		let walletAddress = events[i].returnValues.wallet
		const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, walletAddress, {handleRevert: true})

		investment.requestBlockNumber = events[i].blockNumber
		investment.state = events[i].returnValues.from === events[i].returnValues.investor ? helpers.INVESTMENT_STATE_EXITREQUESTED_INVESTOR : helpers.INVESTMENT_STATE_EXITREQUESTED_TRADER
		investment.value = events[i].returnValues.value

		last = await disbursementCreatedDao.getLastForInvestment(walletAddress, investment.id)
		console.log("DisbursementCreated last", last)
		lastBlock = last ? last.blockNumber + 1 : 0
		console.log("DisbursementCreated blockNumber", lastBlock)

		stream = await walletContract.getPastEvents(
			'DisbursementCreated', {filter: {},fromBlock: lastBlock}
		)
		let disbursementEvents = stream.map(event => event)

		for (let i=0; i<disbursementEvents.length; i++) {
			// get the first event after the end blocknumber that matches the investment

			if (investment.id === disbursementEvents[i].returnValues.investmentId) {

				investment.disbursementId = disbursementEvents[i].returnValues.disbursementId

				let result = await investmentsController.update(investment)
				if (!result) {
					return false
				}

				result = await disbursementCreatedDao.create(walletAddress, disbursementEvents[i])
				if (!result) {
					return false
				}
			}
		}
	}

	return true
}

const processRejectExitEventsForInvestments = async (traderPaired) => {

	let last = await investmentsDao.getRejectLast();
	console.log("Investment reject last", last);
	let lastBlock = last ? last.rejectBlockNumber + 1 : 0;
	console.log("Investment rejectBlockNumber", lastBlock);

	let stream = await traderPaired.getPastEvents(
		'RejectExit', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} RejectExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RejectExit", events[i])

		let investment = await investmentsController.get(events[i].returnValues.id)
		if (!investment) {
			console.error(`Could not find investment ${events[i].returnValues.id}`)
			return false
		}

		if (investment.state !== helpers.INVESTMENT_STATE_EXITREQUESTED_INVESTOR && investment.state !== helpers.INVESTMENT_STATE_EXITREQUESTED_TRADER) {
			// already processed
			console.log("processRejectExitEventsForInvestments wrong state", investment.state)
			continue
		}

		investment.rejectBlockNumber = events[i].blockNumber
		investment.state = helpers.INVESTMENT_STATE_INVESTED
		investment.disbursementId = 0

		let result = await investmentsController.update(investment)
		if (!result) {
			return false
		}
	}

	return true
}

const processApproveExitEventsForInvestments = async (traderPaired) => {

	let last = await investmentsDao.getApproveLast()
	console.log("Investment approve last", last)
	let lastBlock = last ? last.approveBlockNumber + 1 : 0
	console.log("Investment approveBlockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'ApproveExit', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} ApproveExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("ApproveExit", events[i])

		let investment = await investmentsController.get(events[i].returnValues.id)
		if (!investment) {
			console.error(`Could not find investment ${events[i].returnValues.id}`)
			return false
		}

		if (investment.state !== helpers.INVESTMENT_STATE_EXITREQUESTED_INVESTOR && investment.state !== helpers.INVESTMENT_STATE_EXITREQUESTED_TRADER) {
			// already processed
			console.log("processApproveExitEventsForInvestments wrong state", investment.state)
			continue
		}

		investment.approveBlockNumber = events[i].blockNumber
		investment.state = helpers.INVESTMENT_STATE_EXITAPPROVED

		let result = await investmentsController.update(investment)
		if (!result) {
			return false
		}	
	}

	return true
}

const processTrades = async () => {
	console.log("processTrades")
	// Traders
	//
	let traders = await traderDao.list()

	console.log("processTrades", traders)

	for (let i=0; i<traders.length; i++) {
		// add positions
		let result = await positionsHandler.loadTraderPositions(traders[i].user)
		if (!result) {
			return false
		}
	}

	return true
}
exports.processTrades = processTrades

const createdInvestment = async (investmentId, traderPaired) => {
	console.log("createdInvestment", investmentId)

	let result = await processInvestEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.createdInvestment = createdInvestment

const stoppedInvestment = async (investmentId, traderPaired) => {
	console.log("stoppedInvestment", investmentId)

	let result = await processStopEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.stoppedInvestment = stoppedInvestment

const exitRequested = async (investmentId, web3, traderPaired) => {
	console.log("exitRequested", investmentId)

	let result = await processRequestExitEventsForInvestments(web3, traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.exitRequested = exitRequested

const exitRejected = async (investmentId, traderPaired) => {
	console.log("exitRejected", investmentId)

	let result = await processRejectExitEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.exitRejected = exitRejected

const exitApproved = async (investmentId, traderPaired) => {
	console.log("exitApproved", investmentId)

	let result = await processApproveExitEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.exitApproved = exitApproved

const calculateTraderStatistics = async () => {
	console.log('env', process.env.NODE_ENV)
	// Traders
	//
	let traders = await traderDao.list();

	console.log("calculateTraderStatistics", traders);

	if (!traders) {
		return
	}

	traders.forEach(async (trader) => {
		const statistics = await statisticsHandler.calculateTraderStatistics(trader.user, traders)

  		await traderStatisticsDao.saveStatistics(trader.user, statistics)
	})
}
exports.calculateTraderStatistics = calculateTraderStatistics

const calculateInvestorStatistics = async () => {
	console.log('env', process.env.NODE_ENV)
	// Investor
	//
	let investors = await investorDao.list();

	console.log("calculateInvestorStatistics", investors);

	if (!investors) {
		return
	}

	investors.forEach(async (investor) => {
		const statistics = await statisticsHandler.calculateInvestorStatistics(investor.user)

  		await investorStatisticsDao.saveStatistics(investor.user, statistics)
	})
}
exports.calculateInvestorStatistics = calculateInvestorStatistics

