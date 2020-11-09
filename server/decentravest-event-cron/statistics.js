
const BigNumber = require('bignumber.js')
const moment = require('moment')

const traderMysql = require('./mysql/traderpaired/trader')
const investMysql = require('./mysql/traderpaired/invest')
const investorMysql = require('./mysql/traderpaired/investor')
const requestExitMysql = require('./mysql/traderpaired/requestExit')
const rejectExitMysql = require('./mysql/traderpaired/rejectExit')
const approveExitMysql = require('./mysql/traderpaired/approveExit')
const allocateMysql = require('./mysql/traderpaired/allocate')
const stopMysql = require('./mysql/traderpaired/stop')

const tradesMysql = require('./mysql/trades')
const investmentsMysql = require('./mysql/investments')

const helpers = require('./helpers')

const levelRequirements = [
	{collateralReq: 0,   directReq: 0, 	  trustReq: 0,  directLimit: 0},	// 0 - intern
	{collateralReq: 5,   directReq: 0, 	  trustReq: 7,  directLimit: 2},	// 1 - junior
	{collateralReq: 10,  directReq: 10,   trustReq: 8,  directLimit: 5},	// 2 - analyst
	{collateralReq: 20,  directReq: 50,   trustReq: 8,  directLimit: 10},	// 3 - specialist
	{collateralReq: 50,  directReq: 100,  trustReq: 9,  directLimit: 20},	// 4 - associate
	{collateralReq: 100, directReq: 500,  trustReq: 9,  directLimit: 50},	// 5 - entrepreneur
	{collateralReq: 200, directReq: 1000, trustReq: 10, directLimit: 100},	// 6 - tycoon
	{collateralReq: 500, directReq: 5000, trustReq: 10, directLimit: 500}	// 7 - elite
]

const tokenSymbols = ["ETH", "DAI", "USDC"]

module.exports.calculateTraderStatistics = async (account, allTraders) => {

	let investments = await investMysql.getByTrader(account)
	for (let i=0; i<investments.length; i++) {
		investments[i] = await mapInvest(investments[i])
	}

	const stops = await stopMysql.getByTrader(account)

	stops.forEach((stop) => {
		let index = investments.findIndex(investment => investment.investmentId === stop.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapStop(stop)
			}
		}
	})

	const requestExits = await requestExitMysql.getByTrader(account)

	requestExits.forEach((requestExit) => {
		let index = investments.findIndex(investment => investment.investmentId === requestExit.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapRequestExit(requestExit)
			}
		}
	})

	const approveExits = await approveExitMysql.getByTrader(account)

	approveExits.forEach((approveExit) => {
		let index = investments.findIndex(investment => investment.investmentId === approveExit.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapApproveExit(approveExit)
			}
		}
	})

	const rejectExits = await rejectExitMysql.getByTrader(account)

	rejectExits.forEach((rejectExit) => {
		let index = investments.findIndex(investment => investment.investmentId === rejectExit.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapRejectExit(rejectExit)
			}
		}
	})

	const counts = await calculateInvestmentCounts(investments)
	const trustRating = await calculateTrustRating(account, investments)
	const level = await calculateLevel(investments, trustRating)
	const limits = await calculateLimits(account, investments, level)
	const tradingRatings = await calculateTradingRatings(account, allTraders)
	const profitRatings = await calculateProfitRatings(account, allTraders)

	return {
		counts: counts,
		trustRating: trustRating,
		level: level,
		limits: limits,
		tradingRatings: tradingRatings,
		profitRatings: profitRatings
	}
}

module.exports.calculateInvestorStatistics = async (account) => {
	let investments = await investMysql.getByInvestor(account)
	for (let i=0; i<investments.length; i++) {
		investments[i] = await mapInvest(investments[i])
	}

	const stops = await stopMysql.getByInvestor(account)

	stops.forEach((stop) => {
		let index = investments.findIndex(investment => investment.investmentId === stop.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapStop(stop)
			}
		}
	})

	const requestExits = await requestExitMysql.getByInvestor(account)

	requestExits.forEach((requestExit) => {
		let index = investments.findIndex(investment => investment.investmentId === requestExit.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapRequestExit(requestExit)
			}
		}
	})

	const approveExits = await approveExitMysql.getByInvestor(account)

	approveExits.forEach((approveExit) => {
		let index = investments.findIndex(investment => investment.investmentId === approveExit.investmentId)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapApproveExit(approveExit)
			}
		}
	})

	const counts = await calculateInvestmentCounts(investments)

	return {
		counts: counts
	}
}

const calculateInvestmentCounts = async (investments) => {
	let investmentCounts = {}

	investments.forEach((investment) => {
		const tokenSymbol = helpers.tokenSymbolForAddress(investment.token)
		const investmentType = investment.investmentType

		if (!investmentCounts[tokenSymbol]) {
			investmentCounts[tokenSymbol] = {}
		}

		if (!investmentCounts[tokenSymbol][investmentType]) {
			investmentCounts[tokenSymbol][investmentType] = {}
		}

		let counter = investmentCounts[tokenSymbol][investmentType]

		if (investment.approveFrom) {
			// approved
			incrementInvestmentCount(counter, "approved", investment.nettValue.minus(investment.amount))
		} else if (investment.rejectFrom) {
			// rejected
			incrementInvestmentCount(counter, "rejected", investment.nettValue.minus(investment.amount))
		} else if (investment.requestFrom || investment.stopFrom) {
			// pending
			incrementInvestmentCount(counter, "pending", investment.nettValue.minus(investment.amount))
		} else {
			// active
			incrementInvestmentCount(counter, "active", investment.nettValue.minus(investment.amount))
		}
	})

	return investmentCounts
}

const incrementInvestmentCount = (counter, state, amount) => {
	if (!counter[state]) {
		counter[state] = {}
	}

	let side = "positive"

	if (amount.lt(0)) {
		side = "negative"
		amount = amount.abs()
	}

	if (!counter[state][side]) {
		counter[state][side] = {"count": 1, "total": amount.toString()}
	} else {
		counter[state][side].count = counter[state][side].count + 1
		counter[state][side].total = new BigNumber(counter[state][side].total).plus(amount).toString()
	}
}

const calculateLevel = async (investments, trustRating) => {
	let collateralApprovalCount = 0
	let directApprovalCount = 0

	investments.forEach((investment) => {
		// if approved and profitable
		if (investment.approveFrom) {
			
			if (investment.nettValue.minus(investment.amount).gt(0)) {
				if (investment.investmentType === helpers.INVESTMENT_DIRECT) {
					directApprovalCount = directApprovalCount + 1
				} else {
					collateralApprovalCount = collateralApprovalCount + 1
				}
			}
		}
	})

	let level = levelRequirements.length - 1
	for (; level >= 0; level--) {
		if (collateralApprovalCount >= levelRequirements[level].collateralReq &&
			directApprovalCount >= levelRequirements[level].directReq &&
			trustRating >= levelRequirements[level].trustReq) {
			break;
		}
	}

	return level
}

const calculateTrustRating = async (account, investments) => {

	let total = 0
	let bad = 0

	investments.forEach((investment) => {

		if (investment.requestFrom) {
			total = total + 1

			if (investment.requestFrom === account) {
				// trader requested exit, check value
				if (investment.grossValue.lt(investment.value)) {
					// trader requested wrong value
					bad = bad + 1
				}

			} else {
				// investor requested exit
				let now = moment()
				if (investment.approveFrom) {
					if (investment.approveExitDate.diff(investment.requestExitDate) > 48 * 60 * 60 * 1000) {
						bad = bad + 1
					}

				} else if (investment.rejectFrom) {
					if (investment.grossValue.lt(investment.rejectValue)) {
						// trader rejected wrong value
						// console.log("trader rejected with wrong value", investment.grossValue.toString(), investment.value.toString(), investment.rejectValue.toString())
						bad = bad + 1
					}
				} else {
					// still waiting
					if (now.diff(investment.requestExitDate) > 48 * 60 * 60 * 1000) {
						bad = bad + 1
					}
				}
			}
		}
	})

	let trustRating = new BigNumber(0)

	if (total > 0) {
		trustRating = new BigNumber(total - bad).dividedBy(total).multipliedBy(10)
	}

	return trustRating.toString()
}

const calculateLimits = async (account, investments, level) => {
	let latestApproval
	let investmentDirectTotals = []
	let directLimits = {}
	let directInvested = {}

	investments.forEach((investment) => {
		
		if (investment.approveFrom) {
			if (!latestApproval || investment.start.isAfter(latestApproval)) {
				latestApproval = investment.start
			}
		} else {
			if (investment.investmentType === helpers.INVESTMENT_DIRECT) {
				if (investmentDirectTotals[investment.token]) {
					investmentDirectTotals[investment.token] = investmentDirectTotals[investment.token].plus(investment.amount)
				} else {
					investmentDirectTotals[investment.token] = investment.amount
				}
			}
		}
	})

	if (latestApproval) {
		// get allocations just before this
		for (let i=0; i<helpers.userTokens.length; i++) {
			const token = helpers.userTokens[i]

			let allocations = await allocateMysql.getByTraderAndToken(account, token.address)
			allocations = allocations.map(mapAllocate)

			// find the allocation just before the start of this investment
			const allocation = allocations.find(allocation => allocation.eventDate.isBefore(latestApproval))

			if (allocation) {
				// calculate direct investment limit
				let directLimit = allocation.total.multipliedBy(levelRequirements[level].directLimit)
				
				let directInvestment = investmentDirectTotals[token.address]
				if (!directInvestment) {
					directInvestment = new BigNumber(0)
				}
				directLimits[helpers.tokenSymbolForAddress(allocation.token)] = directLimit.toString()
				directInvested[helpers.tokenSymbolForAddress(allocation.token)] = directInvestment.toString()
			}
		}
	}

	return {
		directLimits: directLimits,
		directInvested: directInvested
	}
}

const calculateTradingRatings = async (account, allTraders) => {

	let allLowRel = {
		ETH: null,
		DAI: null,
		USDC: null
	}
	let allHighRel = {
		ETH: null,
		DAI: null,
		USDC: null
	}

	let accountAvgRel = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountAvg = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountTotalRel = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountTotal = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountCnt = {
		ETH: 0,
		DAI: 0,
		USDC: 0
	}

	let ratings = {
		ETH: "0",
		DAI: "0",
		USDC: "0"
	}

	let averageProfits = {
		ETH: "0",
		DAI: "0",
		USDC: "0"
	}

	let assets = ["ETH", "DAI", "USDC"]

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {
		let trader = allTraders[traderIndex]

		let traderAvgRel = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderAvg = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderTotalRel = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderTotal = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderCnt = {
			ETH: 0,
			DAI: 0,
			USDC: 0
		}

		let trades = await tradesMysql.getByTrader(trader.user)
		trades = trades.map(mapTrade)

		for (let tradeIndex=0; tradeIndex<trades.length; tradeIndex++) {
			let trade = trades[tradeIndex]

			const relativeProfit = trade.profit.dividedBy(trade.initialAmount)
			const profit = trade.profit

			traderTotalRel[trade.asset] = traderTotalRel[trade.asset].plus(relativeProfit)
			traderTotal[trade.asset] = traderTotal[trade.asset].plus(profit)
			traderCnt[trade.asset] = traderCnt[trade.asset] + 1

			if (trader.user === account) {
				accountTotalRel[trade.asset] = traderTotalRel[trade.asset]
				accountTotal[trade.asset] = traderTotal[trade.asset]
				accountCnt[trade.asset] = traderCnt[trade.asset]
			}
			
			if (tradeIndex === (trades.length - 1)) {
				// done with trader

				assets.forEach((asset, assetIndex) => {
					if (traderCnt[asset] > 0) {
						traderAvgRel[asset] = traderTotalRel[asset].dividedBy(traderCnt[asset])
						traderAvg[asset] = traderTotal[asset].dividedBy(traderCnt[asset])
					}

					if (allLowRel[asset] === null || traderAvgRel[asset].isLessThan(allLowRel[asset])) {
						allLowRel[asset] = traderAvgRel[asset]
					}

					if (allHighRel[asset] === null || traderAvgRel[asset].isGreaterThanOrEqualTo(allHighRel[asset])) {
						allHighRel[asset] = traderAvgRel[asset]
					}
				})

				if (traderIndex === (allTraders.length - 1)) {
					// done with all

					assets.forEach((asset, assetIndex) => {
						if (accountCnt[asset] > 0) {
							accountAvgRel[asset] = accountTotalRel[asset].dividedBy(accountCnt[asset])
							averageProfits[asset] = accountTotal[asset].dividedBy(accountCnt[asset]).toString()
						}

						if (allLowRel[asset] === null) {
							allLowRel[asset] = new BigNumber(0)
						}
						if (allHighRel[asset] === null) {
							allHighRel[asset] = new BigNumber(0)
						}

						if (accountCnt[asset] === 0) {
							ratings[asset] = "0"
						} else {
							if (allHighRel[asset].isEqualTo(allLowRel[asset])) {
								ratings[asset] = "10"
							} else {
								ratings[asset] = ((accountAvgRel[asset].minus(allLowRel[asset])).dividedBy(allHighRel[asset].minus(allLowRel[asset]))).multipliedBy(10).toString()
							}
						}
					})
				}
			}
		}
	}

	// console.log("tradingRatings", ratings, averageProfits)
	return { ratings, averageProfits }
}

const calculateProfitRatings = async (account, allTraders) => {
	let allLowRel = {
		ETH: null,
		DAI: null,
		USDC: null
	}
	let allHighRel = {
		ETH: null,
		DAI: null,
		USDC: null
	}

	let accountAvgRel = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountAvg = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountTotalRel = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountTotal = {
		ETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountCnt = {
		ETH: 0,
		DAI: 0,
		USDC: 0
	}

	let ratings = {
		ETH: "0",
		DAI: "0",
		USDC: "0"
	}

	let averageProfits = {
		ETH: "0",
		DAI: "0",
		USDC: "0"
	}

	let assets = ["ETH", "DAI", "USDC"]

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {
		let trader = allTraders[traderIndex]

		let traderAvgRel = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderAvg = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderTotalRel = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderTotal = {
			ETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderCnt = {
			ETH: 0,
			DAI: 0,
			USDC: 0
		}

		let investments = await investMysql.getByTrader(trader.user)
		for (let i=0; i<investments.length; i++) {
			investments[i] = await mapInvest(investments[i])
		}

		const requestExits = await requestExitMysql.getByTrader(trader.user)

		requestExits.forEach((requestExit) => {
			// console.log("RequestExit", requestExit)
			let index = investments.findIndex(investment => investment.investmentId === requestExit.investmentId)
			// console.log ("index", index)
			if (index !== -1) {
				investments[index] = {
					...investments[index],
					...mapRequestExit(requestExit)
				}
			}
		})

		const approveExits = await approveExitMysql.getByTrader(trader.user)

		approveExits.forEach((approveExit) => {
			let index = investments.findIndex(investment => investment.investmentId === approveExit.investmentId)
			if (index !== -1) {
				investments[index] = {
					...investments[index],
					...mapApproveExit(approveExit)
				}
			}
		})


		for (let investmentIndex=0; investmentIndex<investments.length; investmentIndex++) {
			let investment = investments[investmentIndex]
			console.log("calculateProfitRatings - investment", investment)
			const tokenSymbol = helpers.tokenSymbolForAddress(investment.token)

			const relativeProfit = (investment.nettValue.minus(investment.amount)).dividedBy(investment.amount)
			const profit = investment.nettValue.minus(investment.amount)

			traderTotalRel[tokenSymbol] = traderTotalRel[tokenSymbol].plus(relativeProfit)
			traderTotal[tokenSymbol] = traderTotal[tokenSymbol].plus(profit)
			traderCnt[tokenSymbol] = traderCnt[tokenSymbol] + 1

			if (trader.user === account) {
				accountTotalRel[tokenSymbol] = traderTotalRel[tokenSymbol]
				accountTotal[tokenSymbol] = traderTotal[tokenSymbol]
				accountCnt[tokenSymbol] = traderCnt[tokenSymbol]
			}
			
			if (investmentIndex === (investments.length - 1)) {
				// done with trader

				assets.forEach((asset, assetIndex) => {
					if (traderCnt[asset] > 0) {
						traderAvgRel[asset] = traderTotalRel[asset].dividedBy(traderCnt[asset])
						traderAvg[asset] = traderTotal[asset].dividedBy(traderCnt[asset])
					}

					if (allLowRel[asset] === null || traderAvgRel[asset].isLessThan(allLowRel[asset])) {
						allLowRel[asset] = traderAvgRel[asset]
					}

					if (allHighRel[asset] === null || traderAvgRel[asset].isGreaterThanOrEqualTo(allHighRel[asset])) {
						allHighRel[asset] = traderAvgRel[asset]
					}
				})

				if (traderIndex === (allTraders.length - 1)) {
					// done with all

					assets.forEach((asset, assetIndex) => {
						if (accountCnt[asset] > 0) {
							accountAvgRel[asset] = accountTotalRel[asset].dividedBy(accountCnt[asset])
							averageProfits[asset] = accountTotal[asset].dividedBy(accountCnt[asset]).toString()
						}

						if (allLowRel[asset] === null) {
							allLowRel[asset] = new BigNumber(0)
						}
						if (allHighRel[asset] === null) {
							allHighRel[asset] = new BigNumber(0)
						}

						if (accountCnt[asset] === 0) {
							ratings[asset] = "0"
						} else {
							if (allHighRel[asset].isEqualTo(allLowRel[asset])) {
								ratings[asset] = "10"
							} else {
								ratings[asset] = ((accountAvgRel[asset].minus(allLowRel[asset])).dividedBy(allHighRel[asset].minus(allLowRel[asset]))).multipliedBy(10).toString()
							}
						}
					})
				}
			}
		}
	}
	// console.log("profitRatings", ratings, averageProfits)
	return { ratings, averageProfits }
}

const mapTrade = (trade) => {
	return {
		...trade,
		start: moment(trade.start),
		end: moment(trade.end),
		profit: new BigNumber(trade.profit),
		initialAmount: new BigNumber(trade.initialAmount)
	}
}

const mapAllocate = (event) => {
	return {
		...event,
		eventDate: moment.unix(event.eventDate).utc(),
		total: new BigNumber(event.total),
		invested: new BigNumber(event.invested)
	}
}

const mapInvest = async (event) => {

	let investment = {
		...event,
		amount: new BigNumber(event.amount),
		value: new BigNumber(0),
		grossValue: new BigNumber(event.amount),
		nettValue: new BigNumber(event.amount),
		investorProfitPercent: new BigNumber(event.investorProfitPercent),
		investmentType: parseInt(event.investmentType, 10),
		start: moment.unix(event.eventDate).utc(),
		end: moment.unix(0).utc(),
		invested: new BigNumber(event.invested),
		state: 0
	}

	investment = await getInvestmentValue(investment)

	return investment
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
		end: moment.unix(event.eventDate).utc(),
		eventDate: moment.unix(event.eventDate).utc(),
		state: 1
	}
}

const mapRequestExit = (event) => {

	let state = 2
	if (event.from === event.trader) {
		state = 3
	}

	return {
		...event,
		value: new BigNumber(event.value),
		requestExitDate: moment.unix(event.eventDate).utc(),
		state: state
	}
}

const mapApproveExit = (event) => {
	return {
		...event,
		approveExitDate: moment.unix(event.eventDate).utc(),
		state: 4
	}
}

const mapRejectExit = (event) => {
	return {
		...event,
		rejectValue: new BigNumber(event.value),
		rejectExitDate: moment.unix(event.eventDate).utc(),
		state: 1
	}
}


const getInvestmentValue = async (investment) => {
	
	let investorProfitPercent = investment.investorProfitPercent.dividedBy(10000)

	// get all trades for this investment
	let trades = await tradesMysql.getByTrader(investment.trader)

	trades = trades.filter(
		(trade) => helpers.tokenAddressForSymbol(trade.asset) === investment.token)

	trades = trades.map(mapTrade)

	trades = trades.filter(trade =>
		trade.start.isAfter(investment.start) 
			&& (
				(investment.end.unix() === 0 || investment.state === 0) 
					|| trade.end.isBefore(investment.end)))

	// console.log("P", trades)

	const allocations = await allocateMysql.getByTraderAndToken(investment.trader, investment.token)

	// console.log("A", allocations)

	const traderInvestments = await getTraderInvestments(investment.trader, investment.token)

	// console.log("traderInvestments", traderInvestments)

	// for each trade get all investments that it should be split over
	// and calculate profit/loss
	let grossProfit = new BigNumber(0)
	await trades.forEach(async (trade) => {

		// find the allocation just before the start of this trade
		let allocation = allocations.find(allocation => allocation.eventDate.isBefore(trade.start))

		// Fallback to the last allocation made, but there should be an allocation made before the trade started
		// TODO: maybe remove?
		if (!allocation) {
			allocation = allocations[0]
		}

		// console.log("allocation total", allocation.total.toString())

		// console.log("trade.profit", trade.profit.toString())
		let totalAmount = await getTradeInvestmentsAmount(trade, traderInvestments)
		// console.log("totalAmount", totalAmount.toString())

		let investorsShare = totalAmount.dividedBy(allocation.total)
		// console.log("investorsShare", investorsShare.toString())

		// split profit according to share of total amount
		let sharePercentage = investment.amount.dividedBy(totalAmount)
		// console.log("sharePercentage", sharePercentage.toString())

		let tradeProfit = trade.profit.multipliedBy(sharePercentage).multipliedBy(investorsShare)
		// console.log("tradeProfit", tradeProfit.toString())

		grossProfit = grossProfit.plus(tradeProfit)
	})

	if (investment.amount.plus(grossProfit).isNegative()) {
		// if losses would amount to a negative valuation, just make the loss equal to the investment amount
		grossProfit = investment.amount.negated()
	}

	let nettProfit = grossProfit
	if (nettProfit.isPositive()) {
		nettProfit = nettProfit.multipliedBy(investorProfitPercent).multipliedBy(0.99)
	}
	console.log("grossProfit", grossProfit.toString())
	console.log("nettProfit", nettProfit.toString())
	investment.grossValue = investment.amount.plus(grossProfit)
	investment.nettValue = investment.amount.plus(nettProfit)
	return investment
}

const getTraderInvestments = async (account, token) => {
	let result = []
	try {
		let investList = await investMysql.getByTraderAndToken(account, token)
		let stopList = await stopMysql.getByTrader(account)

		investList.forEach((investment) => {
			let index = stopList.findIndex(stopped => stopped.investmentId === investment.investmentId)
			if (index !== -1) {
				investment.state = stopList[index].state
				investment.end = stopList[index].end
			}
			return investment
		})
		result = investList

	} catch (err) {
		console.log('Could not getTraderInvestments', err)
	}
	return result
}


const getTradeInvestmentsAmount = async (trade, traderInvestments) => {
	let investments = traderInvestments.filter((investment) => helpers.tokenAddressForSymbol(trade.asset) === investment.token)
	
	investments = investments.filter(investment =>
		trade.start.isAfter(investment.start) 
			&& (
				(investment.end.unix() === 0 || investment.state === 0) 
					|| trade.end.isBefore(investment.end)))
	
	
	let totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), new BigNumber(0))
	return totalAmount
}

