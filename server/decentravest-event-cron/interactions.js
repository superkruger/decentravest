const Web3 = require("web3")
const BigNumber = require('bignumber.js')
const moment = require('moment')
const axios = require('axios')

const mysqlCommon = require('./common/mysql')

const TraderPaired = require('./abis/TraderPaired.json')
const MultiSigFundWalletFactory = require('./abis/MultiSigFundWalletFactory.json')
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
const contractInstantiationDao = require('./dao/multisigfundwalletfactory/contractInstantiation')
const fundDao = require('./dao/multisigfundwallet/fund')
const stoppedDao = require('./dao/multisigfundwallet/stopped')
const disbursementCreatedDao = require('./dao/multisigfundwallet/disbursementCreated')
const disbursementRejectedDao = require('./dao/multisigfundwallet/disbursementRejected')
const disbursementCompletedDao = require('./dao/multisigfundwallet/disbursementCompleted')
const payoutDao = require('./dao/multisigfundwallet/payout')

const traderMysql = require('./mysql/traderpaired/trader')
const investorMysql = require('./mysql/traderpaired/investor')
const investmentMysql = require('./mysql/traderpaired/investment')
const investMysql = require('./mysql/traderpaired/invest')
const requestExitMysql = require('./mysql/traderpaired/requestExit')
const rejectExitMysql = require('./mysql/traderpaired/rejectExit')
const approveExitMysql = require('./mysql/traderpaired/approveExit')
const allocateMysql = require('./mysql/traderpaired/allocate')
const stopMysql = require('./mysql/traderpaired/stop')
const contractInstantiationMysql = require('./mysql/multisigfundwalletfactory/contractInstantiation')
const fundMysql = require('./mysql/multisigfundwallet/fund')
const stoppedMysql = require('./mysql/multisigfundwallet/stopped')
const disbursementCreatedMysql = require('./mysql/multisigfundwallet/disbursementCreated')
const disbursementRejectedMysql = require('./mysql/multisigfundwallet/disbursementRejected')
const disbursementCompletedMysql = require('./mysql/multisigfundwallet/disbursementCompleted')
const payoutMysql = require('./mysql/multisigfundwallet/payout')

const positionsHandler = require('./dydx/positions')

const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')

const investmentsMysql = require('./mysql/investments')
const investmentsController = require('./controller/investments')

const tradesController = require('./controller/trades')
const statisticsController = require('./controller/statistics')

const helpers = require('./helpers')

const loadWeb3 = async () => {

	// console.log('INFURA_BASE_URL: ', process.env.INFURA_BASE_URL);
	// console.log('INFURA_API_KEY: ', process.env.INFURA_API_KEY);
	
	let web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.INFURA_BASE_URL}.infura.io/v3/${process.env.INFURA_API_KEY}`));
	// web3 = new Web3(Web3.givenProvider || 'http://127.0.0.1:8545')
	
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
	let traderPaired

	try {
		if (TraderPaired.networks[networkId] !== undefined) {
			console.log("TraderPaired address: ", TraderPaired.networks[networkId].address)
			traderPaired = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})
		}

	} catch (error) {
		console.error('Contract not deployed to the current network', error)
	}
	return traderPaired
}
exports.loadTraderPaired = loadTraderPaired

const loadWalletFactory = async (web3, networkId) => {
	let walletFactory

	try {
		if (MultiSigFundWalletFactory.networks[networkId] !== undefined) {
			console.log("MultiSigFundWalletFactory address: ", MultiSigFundWalletFactory.networks[networkId].address)
			walletFactory = await new web3.eth.Contract(MultiSigFundWalletFactory.abi, MultiSigFundWalletFactory.networks[networkId].address, {handleRevert: true})
		}
			
	} catch (error) {
		console.error('Contract not deployed to the current network', error)
	}
	return walletFactory
}
exports.loadWalletFactory = loadWalletFactory

const processAllEvents = async (web3, traderPaired, walletFactory) => {
	console.log('processAllEvents START')

	// await mysqlCommon.dropTables() // TODO: remove!!

	await mysqlCommon.createTables()

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
	
	// ContractInstantiation
	//
	if (result) {
		result = await processContractInstantiationEvents(walletFactory)
	}
	
	// Investment
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
		console.log('traderMysql.createOrUpdate', result)
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
		console.log('investorMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processContractInstantiationEvents = async (walletFactory) => {
	let last = await contractInstantiationMysql.getLast()
	console.log("ContractInstantiation last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("ContractInstantiation blockNumber", lastBlock)

	let stream = await walletFactory.getPastEvents(
		'ContractInstantiation', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)
	console.log(`${events.length} ContractInstantiation Events`)
	for (let i=0; i<events.length; i++) {
		console.log("ContractInstantiation", events[i])

		let result = await contractInstantiationDao.create(events[i])
		if (!result) {
			return false
		}

		result = await contractInstantiationDao.get(events[i].id)
		if (!result) {
			return false
		}

		result = await contractInstantiationMysql.createOrUpdate(result)
		console.log('contractInstantiationMysql.createOrUpdate', result)
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
		console.log('investmentMysql.createOrUpdate', result)
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

	let result = await processFundEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	result = await processStoppedEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	result = await processDisbursementCreatedEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	result = await processDisbursementRejectedEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	result = await processDisbursementCompletedEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	result = await processPayoutEvents(walletAddress, walletContract)
	if (!result) {
		return false
	}

	return true
}

const processFundEvents = async (walletAddress, walletContract) => {
	let last = await fundMysql.getLast(walletAddress)
	console.log("Fund last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Fund blockNumber", lastBlock)

	let stream = await walletContract.getPastEvents(
		'Fund', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)

	for (let i=0; i<events.length; i++) {
		console.log("Fund", events[i])

		let result = await fundDao.create(walletAddress, events[i])
		if (!result) {
			return false
		}

		result = await fundDao.get(walletAddress, events[i].id)
		if (!result) {
			return false
		}

		result = await fundMysql.createOrUpdate(walletAddress, result)
		console.log('fundMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processStoppedEvents = async (walletAddress, walletContract) => {
	let last = await stoppedMysql.getLast(walletAddress)
	console.log("Stopped last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Stopped blockNumber", lastBlock)

	let stream = await walletContract.getPastEvents(
		'Stopped', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)

	for (let i=0; i<events.length; i++) {
		console.log("Stopped", events[i])

		let result = await stoppedDao.create(walletAddress, events[i])
		if (!result) {
			return false
		}

		result = await stoppedDao.get(walletAddress, events[i].id)
		if (!result) {
			return false
		}

		result = await stoppedMysql.createOrUpdate(walletAddress, result)
		console.log('stoppedMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
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

const processDisbursementRejectedEvents = async (walletAddress, walletContract) => {
	let last = await disbursementRejectedMysql.getLast(walletAddress)
	console.log("DisbursementRejected last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("DisbursementRejected blockNumber", lastBlock)

	let stream = await walletContract.getPastEvents(
		'DisbursementRejected', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)

	for (let i=0; i<events.length; i++) {
		console.log("DisbursementRejected", events[i])

		let result = await disbursementRejectedDao.create(walletAddress, events[i])
		if (!result) {
			return false
		}

		result = await disbursementRejectedDao.get(walletAddress, events[i].id)
		if (!result) {
			return false
		}

		result = await disbursementRejectedMysql.createOrUpdate(walletAddress, result)
		console.log('disbursementRejectedMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processDisbursementCompletedEvents = async (walletAddress, walletContract) => {
	let last = await disbursementCompletedMysql.getLast(walletAddress)
	console.log("DisbursementCompleted last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("DisbursementCompleted blockNumber", lastBlock)

	let stream = await walletContract.getPastEvents(
		'DisbursementCompleted', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)

	for (let i=0; i<events.length; i++) {
		console.log("DisbursementCompleted", events[i])

		let result = await disbursementCompletedDao.create(walletAddress, events[i])
		if (!result) {
			return false
		}

		result = await disbursementCompletedDao.get(walletAddress, events[i].id)
		if (!result) {
			return false
		}

		result = await disbursementCompletedMysql.createOrUpdate(walletAddress, result)
		console.log('disbursementCompletedMysql.createOrUpdate', result)
		if (!result) {
			return false
		}
	}
	return true
}

const processPayoutEvents = async (walletAddress, walletContract) => {
	let last = await payoutMysql.getLast(walletAddress)
	console.log("Payout last", last)
	let lastBlock = last ? last.blockNumber + 1 : 0
	console.log("Payout blockNumber", lastBlock)

	let stream = await walletContract.getPastEvents(
		'Payout', {filter: {},fromBlock: lastBlock}
	)
	let events = stream.map(event => event)

	for (let i=0; i<events.length; i++) {
		console.log("Payout", events[i])

		let result = await payoutDao.create(walletAddress, events[i])
		if (!result) {
			return false
		}

		result = await payoutDao.get(walletAddress, events[i].id)
		if (!result) {
			return false
		}

		result = await payoutMysql.createOrUpdate(walletAddress, result)
		console.log('payoutMysql.createOrUpdate', result)
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
		investment.stopTxHash = events[i].txHash

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
		investment.requestTxHash = events[i].txHash

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
		investment.rejectTxHash = events[i].txHash

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
		investment.approveTxHash = events[i].txHash

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
	let traders = await traderMysql.list()

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

	result = await traderMysql.getByUser(trader)

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

	result = await investorMysql.getByUser(investor)

	return result
}
exports.joinedInvestor = joinedInvestor

const createdInvestment = async (investmentId, traderPaired) => {
	console.log("createdInvestment", investmentId)

	let result = await processInvestEvents(traderPaired)

	if (!result) {
		return null
	}

	let invest = await investMysql.get(investmentId)
	if (!invest) {
		return null
	}

	const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, invest.wallet, {handleRevert: true})

	if (!walletContract) {
		console.error("Invalid wallet for invest", invest)
		return false
	}

	result = await processFundEvents(invest.wallet, walletContract)
	if (!result) {
		return false
	}

	result = await processInvestEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsMysql.get(investmentId)

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

	let invest = await investMysql.get(investmentId)
	if (!invest) {
		return null
	}

	const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, invest.wallet, {handleRevert: true})

	if (!walletContract) {
		console.error("Invalid wallet for invest", invest)
		return false
	}

	result = await processStoppedEvents(invest.wallet, walletContract)
	if (!result) {
		return false
	}

	result = await processStopEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsMysql.get(investmentId)

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

	let invest = await investMysql.get(investmentId)
	if (!invest) {
		return null
	}

	const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, invest.wallet, {handleRevert: true})

	if (!walletContract) {
		console.error("Invalid wallet for invest", invest)
		return false
	}

	result = await processDisbursementCreatedEvents(invest.wallet, walletContract)
	if (!result) {
		return false
	}

	result = await processRequestExitEventsForInvestments(web3, traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsMysql.get(investmentId)

	return investment
}
exports.exitRequested = exitRequested

const exitRejected = async (investmentId, traderPaired) => {
	console.log("exitRejected", investmentId)

	let result = await processRejectExitEvents(traderPaired)

	if (!result) {
		return null
	}

	let invest = await investMysql.get(investmentId)
	if (!invest) {
		return null
	}

	const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, invest.wallet, {handleRevert: true})

	if (!walletContract) {
		console.error("Invalid wallet for invest", invest)
		return false
	}

	result = await processDisbursementRejectedEvents(invest.wallet, walletContract)
	if (!result) {
		return false
	}

	result = await processRejectExitEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsMysql.get(investmentId)

	return investment
}
exports.exitRejected = exitRejected

const exitApproved = async (investmentId, traderPaired) => {
	console.log("exitApproved", investmentId)

	let result = await processApproveExitEvents(traderPaired)

	if (!result) {
		return null
	}

	let invest = await investMysql.get(investmentId)
	if (!invest) {
		return null
	}

	const walletContract = await new web3.eth.Contract(MultiSigFundWallet.abi, invest.wallet, {handleRevert: true})

	if (!walletContract) {
		console.error("Invalid wallet for invest", invest)
		return false
	}

	result = await processDisbursementCompletedEvents(invest.wallet, walletContract)
	if (!result) {
		return false
	}
	
	result = await processPayoutEvents(invest.wallet, walletContract)
	if (!result) {
		return false
	}

	result = await processApproveExitEventsForInvestments(traderPaired)

	if (!result) {
		return null
	}

	let investment = await investmentsMysql.get(investmentId)

	return investment
}
exports.exitApproved = exitApproved

const calculateTraderStatistics = async (trader) => {
	// Traders
	//
	let traders = await traderMysql.list()

	const statistics = await statisticsController.calculateTraderStatistics(trader, traders)

	let result = await traderStatisticsDao.saveStatistics(trader, statistics)

	return result
	
}

const calculateInvestorStatistics = async (investor) => {
	
	const statistics = await statisticsController.calculateInvestorStatistics(investor)

	let result = await investorStatisticsDao.saveStatistics(investor, statistics)
	
	return result
}

const calculateAllTradersStatistics = async () => {
	// Traders
	//
	let traders = await traderMysql.list();

	console.log("calculateTraderStatistics", traders);

	if (!traders) {
		return
	}

	for (let i=0; i<traders.length; i++) {
		const statistics = await statisticsController.calculateTraderStatistics(traders[i].user, traders)

  		await traderStatisticsDao.saveStatistics(traders[i].user, statistics)
	}
}
exports.calculateAllTradersStatistics = calculateAllTradersStatistics

const calculateAllInvestorsStatistics = async () => {
	// Investor
	//
	let investors = await investorMysql.list();

	console.log("calculateInvestorStatistics", investors);

	if (!investors) {
		return
	}

	for (let i=0; i<investors.length; i++) {
		const statistics = await statisticsController.calculateInvestorStatistics(investors[i].user)

  		await investorStatisticsDao.saveStatistics(investors[i].user, statistics)
	}
}
exports.calculateAllInvestorsStatistics = calculateAllInvestorsStatistics

const calculateAllInvestmentValues = async () => {
	
	let investments = await investmentsController.listActive();

	console.log("calculateAllInvestmentValues");

	if (!investments) {
		return
	}

	for (let i=0; i<investments.length; i++) {
		let result = await statisticsController.setInvestmentValue(investments[i])
		result = await investmentsController.update(result)
		console.log("setInvestmentValue result", result)
	}
}
exports.calculateAllInvestmentValues = calculateAllInvestmentValues
