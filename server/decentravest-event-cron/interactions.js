const Web3 = require("web3");
const BigNumber = require('bignumber.js')

const TraderPaired = require('./abis/TraderPaired.json')
const traderEventHandler = require('./traderpaired/trader')
const investorEventHandler = require('./traderpaired/investor')
const investEventHandler = require('./traderpaired/invest')
const requestExitEventHandler = require('./traderpaired/requestExit')
const rejectExitEventHandler = require('./traderpaired/rejectExit')
const approveExitEventHandler = require('./traderpaired/approveExit')
const allocateEventHandler = require('./traderpaired/allocate')
const stopEventHandler = require('./traderpaired/stop')

const positionsHandler = require('./dydx/positions')

const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')

const statisticsHandler = require('./statistics')

const axios = require('axios');

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

const processEvents = async (web3, networkId) => {
	console.log('processEvents START')
	let traderPaired = await loadTraderPaired(web3, networkId)
	let lastBlock = 0;

	// Trader
	//
	let last = await traderEventHandler.getLast();
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

		await traderEventHandler.create(events[i]);
	}

	// Investor
	//
	last = await investorEventHandler.getLast();
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

		await investorEventHandler.create(events[i]);
	}

	// Invest
	//
	last = await investEventHandler.getLast();
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

		await investEventHandler.create(events[i]);
	}

	// RequestExit
	//
	last = await requestExitEventHandler.getLast();
	console.log("RequestExit last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("RequestExit blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'RequestExit', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} RequestExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("RequestExit", events[i])

		await requestExitEventHandler.create(events[i]);
	}

	// RejectExit
	//
	last = await rejectExitEventHandler.getLast();
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

		await rejectExitEventHandler.create(events[i]);
	}

	// ApproveExit
	//
	last = await approveExitEventHandler.getLast();
	console.log("ApproveExit last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("ApproveExit blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'ApproveExit', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} ApproveExit Events`)
	for (let i=0; i<events.length; i++) {
		console.log("ApproveExit", events[i])

		await approveExitEventHandler.create(events[i]);
	}

	// Allocate
	//
	last = await allocateEventHandler.getLast();
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

		await allocateEventHandler.create(events[i]);
	}

	// Stop
	//
	last = await stopEventHandler.getLast();
	console.log("Stop last", last);
	lastBlock = last ? last.blockNumber + 1 : 0;
	console.log("Stop blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'Stop', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	console.log(`${events.length} Stop Events`)
	for (let i=0; i<events.length; i++) {
		console.log("Stop", events[i])

		await stopEventHandler.create(events[i]);
	}

	console.log('processEvents END')
}
exports.processEvents = processEvents

const processTrades = async () => {
	console.log("processTrades")
	// Traders
	//
	let traders = await traderEventHandler.list();

	console.log("processTrades", traders);

	traders.forEach(async (trader) => {
		// add positions
  		await positionsHandler.loadTraderPositions(trader.user);
	});
}
exports.processTrades = processTrades

const updateTrades = async (account) => {
	console.log("updateTrades", account);

	await positionsHandler.loadTraderPositions(account)
}
exports.updateTrades = updateTrades

const calculateTraderStatistics = async () => {
	console.log('env', process.env.NODE_ENV)
	// Traders
	//
	let traders = await traderEventHandler.list();

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
	let investors = await investorEventHandler.list();

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

