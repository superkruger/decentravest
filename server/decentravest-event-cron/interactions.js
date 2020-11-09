const Web3 = require("web3")
const BigNumber = require('bignumber.js')
const moment = require('moment')
const axios = require('axios')

const mysqlCommon = require('./common/mysql')

const TraderPaired = require('./abis/TraderPaired.json')
const MultiSigFundWallet = require('./abis/MultiSigFundWallet.json')

const traderDao = require('./dao/traderpaired/trader')
const investorDao = require('./dao/traderpaired/investor')
const investmentDao = require('./dao/traderpaired/investment')
const investDao = require('./dao/traderpaired/invest')
const requestExitDao = require('./dao/traderpaired/requestExit')
const rejectExitDao = require('./dao/traderpaired/rejectExit')
const approveExitDao = require('./dao/traderpaired/approveExit')
const allocateDao = require('./dao/traderpaired/allocate')
const stopDao = require('./dao/traderpaired/stop')
const disbursementCreatedDao = require('./dao/multisigfundwallet/disbursementCreated')

const traderMysql = require('./mysql/traderpaired/trader')
const investorMysql = require('./mysql/traderpaired/investor')
const investmentMysql = require('./mysql/traderpaired/investment')
const investMysql = require('./mysql/traderpaired/invest')
const requestExitMysql = require('./mysql/traderpaired/requestExit')
const rejectExitMysql = require('./mysql/traderpaired/rejectExit')
const approveExitMysql = require('./mysql/traderpaired/approveExit')
const allocateMysql = require('./mysql/traderpaired/allocate')
const stopMysql = require('./mysql/traderpaired/stop')
const disbursementCreatedMysql = require('./mysql/multisigfundwallet/disbursementCreated')

const positionsHandler = require('./dydx/positions')

const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')

const investmentsMysql = require('./mysql/investments')
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

const processAllEvents = async (web3, traderPaired) => {
	console.log('processAllEvents START')

	await mysqlCommon.dropTables() // TODO: remove!!

	await mysqlCommon.createTables()

	// let client = mysqlCommon.getClient()

	let lastBlock = 0;
	let result = true

	// Trader
	//
	if (result) {
		result = await processTraderEvents(traderPaired)
	}

	// Investor
	//
	if (result) {
		result = await processInvestorEvents(traderPaired)
	}
	
	// Investor
	//
	if (result) {
		result = await processInvestmentEvents(web3, traderPaired)
	}
	
	// Invest
	//
	if (result) {
		result = await processInvestEvents(traderPaired)
	}

	// Stop
	//
	if (result) {
		result = await processStopEvents(traderPaired)
	}
	
	// RequestExit
	//
	if (result) {
		result = await processRequestExitEvents(traderPaired)
	}
	
	// RejectExit
	//
	if (result) {
		result = await processRejectExitEvents(traderPaired)
	}

	// ApproveExit
	//
	if (result) {
		result = await processApproveExitEvents(traderPaired)
	}
	
	// Allocate
	//
	if (result) {
		result = await processAllocateEvents(traderPaired)
	}

	if (result) {
		result = await processEventsForInvestments(web3, traderPaired)
	}

	// client.quit()
	console.log('processAllEvents END')
	return result
}
exports.processAllEvents = processAllEvents

const processTraderEvents = async (traderPaired) => {
	let last = await traderMysql.getLast()
	console.log("Trader last", last)
	lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Trader blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'Trader', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Trader Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Trader", events[i])

		let result = await traderDao.create(events[i])
		if (!result) {
			return false
		}

		result = await traderDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await traderMysql.createOrUpdate(result)
		console.log('traderMysql.create', result)
		if (!result) {
			return false
		}

	}
	return true
}

const processInvestorEvents = async (traderPaired) => {
	let last = await investorMysql.getLast()
	console.log("Investor last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Investor blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'Investor', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Investor Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Investor", events[i])

		let result = await investorDao.create(events[i])
		if (!result) {
			return false
		}

		result = await investorDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await investorMysql.createOrUpdate(result)
		console.log('investorMysql.create', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processInvestmentEvents = async (web3, traderPaired) => {
	let last = await investmentMysql.getLast()
	console.log("Investment last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Investment blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'Investment', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Investment Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Investment", events[i])

		let result = await investmentDao.create(events[i])
		if (!result) {
			return false
		}

		result = await investmentDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await investmentMysql.createOrUpdate(result)
		console.log('investmentMysql.create', result)
		if (!result) {
			return false
		}
	}

	let investmentEvents = await investmentMysql.list()

	for (let i=0; i<investmentEvents.length; i++) {

		let walletAddress = investmentEvents[i].wallet
		const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, walletAddress, {handleRevert: true})

		if (!walletContract) {
			console.error("Invalid wallet for investment event", investmentEvents[i])
			return false
		}

		let result = await processWalletEvents(walletAddress, walletContract)
		if (!result) {
			return false
		}
	}

	return true
}

const processWalletEvents = async (walletAddress, walletContract) => {
	console.log("processWalletEvents", walletAddress)
	let result = await processDisbursementCreatedEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	return true
}

const processDisbursementCreatedEvents = async (walletAddress, walletContract) => {
	let last = await disbursementCreatedMysql.getLast(walletAddress)
	console.log("DisbursementCreated last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("DisbursementCreated blockNumber", lastBlock)

	let stream = await walletContract.getPastEvents(
		'DisbursementCreated', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)

	for (let i=0; i<events.length; i++) {
		console.log("DisbursementCreated", events[i])

		let result = await disbursementCreatedDao.create(walletAddress, events[i])
		if (!result) {
			return false
		}

		result = await disbursementCreatedDao.get(walletAddress, events[i].id)
		if (!result) {
			return false
		}

		result = await disbursementCreatedMysql.createOrUpdate(walletAddress, result)
		console.log('disbursementCreatedMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processInvestEvents = async (traderPaired) => {
	let last = await investMysql.getLast()
	console.log("Invest last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Invest blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'Invest', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Invest Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Invest", events[i])

		let result = await investDao.create(events[i])
		if (!result) {
			return false
		}

		result = await investDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await investMysql.createOrUpdate(result)
		console.log('investMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processStopEvents = async (traderPaired) => {
	let last = await stopMysql.getLast()
	console.log("Stop last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Stop blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'Stop', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Stop Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Stop", events[i])

		let result = await stopDao.create(events[i])
		if (!result) {
			return false
		}

		result = await stopDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await stopMysql.createOrUpdate(result)
		console.log('stopMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processRequestExitEvents = async (traderPaired) => {
	let last = await requestExitMysql.getLast()
	console.log("RequestExit last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("RequestExit blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'RequestExit', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} RequestExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RequestExit", events[i])

		let result = await requestExitDao.create(events[i])
		if (!result) {
			return false
		}

		result = await requestExitDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await requestExitMysql.createOrUpdate(result)
		console.log('requestExitMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processRejectExitEvents = async (traderPaired) => {
	let last = await rejectExitMysql.getLast();
	console.log("RejectExit last", last);
	let lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("RejectExit blockNumber", lastBlock);

	let stream = await traderPaired.getPastEvents(
		'RejectExit', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} RejectExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RejectExit", events[i])

		let result = await rejectExitDao.create(events[i])
		if (!result) {
			return false
		}

		result = await rejectExitDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await rejectExitMysql.createOrUpdate(result)
		console.log('rejectExitMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processApproveExitEvents = async (traderPaired) => {
	let last = await approveExitMysql.getLast()
	console.log("ApproveExit last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("ApproveExit blockNumber", lastBlock)

	let stream = await traderPaired.getPastEvents(
		'ApproveExit', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} ApproveExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("ApproveExit", events[i])

		let result = await approveExitDao.create(events[i])
		if (!result) {
			return false
		}

		result = await approveExitDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await approveExitMysql.createOrUpdate(result)
		console.log('approveExitMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processAllocateEvents = async (traderPaired) => {
	let last = await allocateMysql.getLast();
	console.log("Allocate last", last);
	let lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("Allocate blockNumber", lastBlock);

	let stream = await traderPaired.getPastEvents(
		'Allocate', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} Allocate Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Allocate", events[i])

		result = await allocateDao.create(events[i]);
		if (!result) {
			return false
		}

		result = await allocateDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await allocateMysql.createOrUpdate(result)
		console.log('allocateMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

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

	let last = await investmentsMysql.getInvestLast();
	console.log("Investment invest last", last);
	let lastBlock = last ? last.investBlockNumber + 1 : 0;
	console.log("Investment investBlockNumber", lastBlock);

	let events = await investMysql.getEventsFromBlock(lastBlock)

	console.log(`${events.length} Invest Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Invest", events[i])
		
		let result = await investmentsController.create(events[i])
		if (!result) {
			return false
		}
	}

	return true
}

const processStopEventsForInvestments = async (traderPaired) => {

	let last = await investmentsMysql.getStopLast()
	console.log("Investment stop last", last)
	let lastBlock = last ? last.stopBlockNumber + 1 : 0
	console.log("Investment stopBlockNumber", lastBlock)

	let events = await stopMysql.getEventsFromBlock(lastBlock)

	console.log(`${events.length} Stop Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Stop", events[i])

		let investment = await investmentsController.get(events[i].investmentId)
		if (!investment) {
			console.error(`Could not find investment ${events[i].investmentId} to stop`)
			return false
		}

		if (investment.state !== helpers.INVESTMENT_STATE_INVESTED) {
			// already processed
			console.log("processStopEventsForInvestments wrong state", investment.state)
			continue
		}

		investment.stopBlockNumber = events[i].blockNumber
		investment.endDate = moment.unix(parseInt(events[i].eventDate, 10))
		investment.state = helpers.INVESTMENT_STATE_STOPPED

		let result = await positionsHandler.loadTraderPositions(investment.trader)
		if (!result) {
			console.error(`Could not process trades for investment ${events[i].investmentId} to stop`)
			return false
		}

		investment = await statisticsController.setInvestmentValue(investment)
		if (!investment) {
			console.error(`Could not update value for investment ${events[i].investmentId} to stop`)
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

	let last = await investmentsMysql.getRequestLast()
	console.log("Investment request last", last)
	let lastBlock = last ? last.requestBlockNumber + 1 : 0
	console.log("Investment requestBlockNumber", lastBlock)

	let events = await requestExitMysql.getEventsFromBlock(lastBlock)

	console.log(`${events.length} RequestExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RequestExit", events[i])

		let investment = await investmentsController.get(events[i].investmentId)
		if (!investment) {
			console.error(`Could not find investment ${events[i].investmentId}`)
			return false
		}

		if (investment.state !== helpers.INVESTMENT_STATE_STOPPED) {
			// already processed
			console.log("processRequestExitEventsForInvestments wrong state", investment.state)
			continue
		}

		let walletAddress = events[i].wallet
		
		investment.requestBlockNumber = events[i].blockNumber
		investment.state = events[i].requestFrom === events[i].investor ? helpers.INVESTMENT_STATE_EXITREQUESTED_INVESTOR : helpers.INVESTMENT_STATE_EXITREQUESTED_TRADER
		investment.value = events[i].value

		disbursement = await disbursementCreatedMysql.getLastForInvestment(walletAddress, investment.id)
		console.log("DisbursementCreated last", disbursement)
		
		if (disbursement) {
			investment.disbursementId = disbursement.disbursementId

			let result = await investmentsController.update(investment)
			if (!result) {
				return false
			}
		} else {
			console.error("No disbursement event found")
			return false
		}
	}

	return true
}

const processRejectExitEventsForInvestments = async (traderPaired) => {

	let last = await investmentsMysql.getRejectLast();
	console.log("Investment reject last", last);
	let lastBlock = last ? last.rejectBlockNumber + 1 : 0;
	console.log("Investment rejectBlockNumber", lastBlock);

	let events = await rejectExitMysql.getEventsFromBlock(lastBlock)

	console.log(`${events.length} RejectExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RejectExit", events[i])

		let investment = await investmentsController.get(events[i].investmentId)
		if (!investment) {
			console.error(`Could not find investment ${events[i].investmentId}`)
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

	let last = await investmentsMysql.getApproveLast()
	console.log("Investment approve last", last)
	let lastBlock = last ? last.approveBlockNumber + 1 : 0
	console.log("Investment approveBlockNumber", lastBlock)

	let events = await approveExitMysql.getEventsFromBlock(lastBlock)

	console.log(`${events.length} ApproveExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("ApproveExit", events[i])

		let investment = await investmentsController.get(events[i].investmentId)
		if (!investment) {
			console.error(`Could not find investment ${events[i].investmentId}`)
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

const processTrades = async (trader) => {
	console.log("processTrades", trader)
	
	let result = await positionsHandler.loadTraderPositions(traders)

	return result
}

const processAllTrades = async () => {
	console.log("processAllTrades")
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
exports.processAllTrades = processAllTrades

const joinedTrader = async (trader, traderPaired) => {
	console.log("joinedTrader", trader)

	let result = await processTraderEvents(traderPaired)
	if (!result) {
		return null
	}

	result = await processTrades(trader)
	if (!result) {
		return null
	}

	result = await calculateTraderStatistics(trader)
	if (!result) {
		return null
	}

	result = await traderDao.getByUser(trader)

	return result
}
exports.joinedTrader = joinedTrader

const joinedInvestor = async (investor, traderPaired) => {
	console.log("joinedInvestor", investor)

	let result = await processInvestorEvents(traderPaired)
	if (!result) {
		return null
	}

	result = await calculateInvestorStatistics(investor)
	if (!result) {
		return null
	}

	result = await investorDao.getByUser(investor)

	return result
}
exports.joinedInvestor = joinedInvestor

const createdInvestment = async (investmentId, traderPaired) => {
	console.log("createdInvestment", investmentId)

	let result = await processInvestEvents(traderPaired)

	if (!result) {
		return null
	}

	result = await processInvestEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	result = await calculateTraderStatistics(investment.trader)
	if (!result) {
		return null
	}

	return investment
}
exports.createdInvestment = createdInvestment

const stoppedInvestment = async (investmentId, traderPaired) => {
	console.log("stoppedInvestment", investmentId)

	let result = await processStopEvents(traderPaired)

	if (!result) {
		return null
	}

	result = await processStopEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	result = await calculateTraderStatistics(investment.trader)
	if (!result) {
		return null
	}

	return investment
}
exports.stoppedInvestment = stoppedInvestment

const exitRequested = async (investmentId, web3, traderPaired) => {
	console.log("exitRequested", investmentId)

	let result = await processRequestExitEvents(traderPaired)

	if (!result) {
		return null
	}

	result = await processRequestExitEventsForInvestments(web3, traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.exitRequested = exitRequested

const exitRejected = async (investmentId, traderPaired) => {
	console.log("exitRejected", investmentId)

	let result = await processRejectExitEvents(traderPaired)

	if (!result) {
		return null
	}

	result = await processRejectExitEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.exitRejected = exitRejected

const exitApproved = async (investmentId, traderPaired) => {
	console.log("exitApproved", investmentId)

	let result = await processApproveExitEvents(traderPaired)

	if (!result) {
		return null
	}

	result = await processApproveExitEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsDao.get(investmentId)

	return investment
}
exports.exitApproved = exitApproved

const calculateTraderStatistics = async (trader) => {
	// Traders
	//
	let traders = await traderDao.list()

	const statistics = await statisticsHandler.calculateTraderStatistics(trader, traders)

	let result = await traderStatisticsDao.saveStatistics(trader, statistics)

	return result
	
}

const calculateInvestorStatistics = async (investor) => {
	
	const statistics = await statisticsHandler.calculateInvestorStatistics(investor)

	let result = await investorStatisticsDao.saveStatistics(investor, statistics)
	
	return result
}

const calculateAllTradersStatistics = async () => {
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
exports.calculateAllTradersStatistics = calculateAllTradersStatistics

const calculateAllInvestorsStatistics = async () => {
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
exports.calculateAllInvestorsStatistics = calculateAllInvestorsStatistics

const calculateAllInvestmentValues = async () => {
	
	let investments = await investmentsController.listActive();

	console.log("calculateAllInvestmentValues");

	if (!investments) {
		return
	}

	investments.forEach(async (investment) => {
		const result = await statisticsController.setInvestmentValue(investment)
		console.log("setInvestmentValue result", result)
	})
}
exports.calculateAllInvestmentValues = calculateAllInvestmentValues
