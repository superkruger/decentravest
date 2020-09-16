const Web3 = require("web3");
const BigNumber = require('bignumber.js')

const TraderPaired = require('./abis/TraderPaired.json')
const traderEventHandler = require('./traderpaired/trader')
const investorEventHandler = require('./traderpaired/investor')
const investEventHandler = require('./traderpaired/invest')

const positionsHandler = require('dydx/positions')

const loadWeb3 = async () => {
	console.log('loadWeb3');
	console.log('INFURA_BASE_URL: ', process.env.INFURA_BASE_URL);
	console.log('INFURA_API_KEY: ', process.env.INFURA_API_KEY);
	let web3 = new Web3(new Web3.providers.HttpProvider(`https://${process.env.INFURA_BASE_URL}.infura.io/v3/${process.env.INFURA_API_KEY}`));
	// web3 = new Web3(Web3.givenProvider || 'http://127.0.0.1:8545')
	console.log("web3", web3);
	if (web3) {
		// let networkType = await web3.eth.net.getNetworkType()
		// console.log("networkType", networkType)
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
	let traderPaired = await loadTraderPaired(web3, networkId)
	let lastBlock = 0;

	// Trader
	//
	// let last = await traderEventHandler.getLast();
	// console.log("Trader last", last);
	// lastBlock = last.error || !last.result ? 0 : last.result.blockNumber + 1;
	// console.log("Trader blockNumber", lastBlock);

	let stream = await traderPaired.getPastEvents(
		'Trader', {filter: {},fromBlock: 0}
	)
	let events = stream.map(event => event)
	for (let i=0; i<events.length; i++) {
		console.log("Trader", events[i])

		await traderEventHandler.create(events[i]);
	}

	return;

	// Investor
	//
	last = await investorEventHandler.getLast();
	console.log("Investor last", last);
	lastBlock = last.error || !last.result ? 0 : last.result.blockNumber + 1;
	console.log("Investor blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'Investor', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	for (let i=0; i<events.length; i++) {
		console.log("Investor", events[i])

		await investorEventHandler.create(events[i]);
	}

	// Invest
	//
	last = await investEventHandler.getLast();
	console.log("Invest last", last);
	lastBlock = last.error || !last.result ? 0 : last.result.blockNumber + 1;
	console.log("Invest blockNumber", lastBlock);

	stream = await traderPaired.getPastEvents(
		'Invest', {filter: {},fromBlock: lastBlock}
	)
	events = stream.map(event => event)
	for (let i=0; i<events.length; i++) {
		console.log("Invest", events[i])

		await investEventHandler.create(events[i]);
	}
}
exports.processEvents = processEvents

const processPositions = async () => {
	console.log("processPositions")
	// Traders
	//
	let traders = await traderEventHandler.list();

	console.log("processPositions", traders);

	if (traders.error || !traders.result) {
		return
	}

	traders.result.forEach(async (trader) => {
		// add positions
  		await positionsHandler.loadTraderPositions(trader.user);
	});
}
exports.processPositions = processPositions

const calculateRatings = async () => {
	// Traders
	//
	let traders = await traderEventHandler.list();

	console.log("calculateRatings", traders);

	if (traders.error || !traders.result) {
		return
	}

	traders.result.forEach(async (trader) => {
  		await calculatePerformanceRating(trader.user, traders.result);
  		await calculateProfitRating(trader.user);
  		await calculateTrustRating(trader.user);
	});
}
exports.calculateRatings = calculateRatings

/////

const calculatePerformanceRating = async (account, allTraders) => {

	console.log("calculatePerformanceRating", account, allTraders);

	let allLow = {
		WETH: null,
		DAI: null,
		USDC: null
	}
	let allHigh = {
		WETH: null,
		DAI: null,
		USDC: null
	}

	let accountAvg = {
		WETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountTotal = {
		WETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountCnt = {
		WETH: 0,
		DAI: 0,
		USDC: 0
	}

	let ratings = {
		WETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}

	let assets = ["WETH", "DAI", "USDC"]

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {

		console.log("trader allTraders", allTraders[traderIndex]);

		let trader = allTraders[traderIndex]

		let traderAvg = {
			WETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderTotal = {
			WETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderCnt = {
			WETH: 0,
			DAI: 0,
			USDC: 0
		}

		let positions = await positionsHandler.getTraderPositionsFromTable(trader.user)

		for (let positionIndex=0; positionIndex<positions.length; positionIndex++) {
			let position = positions[positionIndex]

			const relativeProfit = position.nettProfit.dividedBy(position.initialAmount)

			traderTotal[position.asset] = traderTotal[position.asset].plus(relativeProfit)
			traderCnt[position.asset] = traderCnt[position.asset] + 1

			if (trader.user === account) {
				accountTotal[position.asset] = traderTotal[position.asset]
				accountCnt[position.asset] = traderCnt[position.asset]
			}
			
			if (positionIndex === (positions.length - 1)) {
				// done with trader

				assets.forEach((asset, assetIndex) => {
					if (traderCnt[asset] > 0) {
						traderAvg[asset] = traderTotal[asset].dividedBy(traderCnt[asset])
					}

					if (allLow[asset] === null || traderAvg[asset].isLessThan(allLow[asset])) {
						allLow[asset] = traderAvg[asset]
					}

					if (allHigh[asset] === null || traderAvg[asset].isGreaterThanOrEqualTo(allHigh[asset])) {
						allHigh[asset] = traderAvg[asset]
					}
				})

				if (traderIndex === (allTraders.length - 1)) {
					// done with all

					assets.forEach((asset, assetIndex) => {
						if (accountCnt[asset] > 0) {
							accountAvg[asset] = accountTotal[asset].dividedBy(accountCnt[asset])
						}

						if (allLow[asset] === null) {
							allLow[asset] = new BigNumber(0)
						}
						if (allHigh[asset] === null) {
							allHigh[asset] = new BigNumber(0)
						}

						if (accountCnt[asset] === 0) {
							ratings[asset] = new BigNumber(0)
						} else {
							if (allHigh[asset].isEqualTo(allLow[asset])) {
								ratings[asset] = new BigNumber(10)
							} else {
								ratings[asset] = ((accountAvg[asset].minus(allLow[asset])).dividedBy(allHigh[asset].minus(allLow[asset]))).multipliedBy(10)
							}
						}
					})

					console.log("Performance Rating", account, ratings);
				}
			}
		}
	}
}

const calculateProfitRating = async (account) => {
}

const calculateTrustRating = async (account) => {
}
