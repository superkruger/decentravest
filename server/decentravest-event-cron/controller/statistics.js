
const BigNumber = require('bignumber.js')
const moment = require('moment')
const _ = require('lodash')

const traderStatisticsDao = require('../dao/traderStatistics')
const tradesController = require('./trades')

const traderMysql = require('../mysql/traderpaired/trader')
const investorMysql = require('../mysql/traderpaired/investor')
const investMysql = require('../mysql/traderpaired/invest')
const stopMysql = require('../mysql/traderpaired/stop')
const requestExitMysql = require('../mysql/traderpaired/requestExit')
const rejectExitMysql = require('../mysql/traderpaired/rejectExit')
const approveExitMysql = require('../mysql/traderpaired/approveExit')
const allocateMysql = require('../mysql/traderpaired/allocate')

const tradesMysql = require('../mysql/trades')

const helpers = require('../helpers')

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000
const ONE_YEAR_DAYS = 365

const levelRequirements = [
  {title: "intern",       collateralReq: 0,   directReq: 0,    trustReq: 0,  directLimit: 0},
  {title: "junior",       collateralReq: 1,   directReq: 0,    trustReq: 7,  directLimit: 5},
  {title: "analyst",      collateralReq: 2,   directReq: 20,   trustReq: 8,  directLimit: 20},
  {title: "specialist",   collateralReq: 5,   directReq: 50,   trustReq: 9,  directLimit: 50},
  {title: "associate",    collateralReq: 10,  directReq: 100,  trustReq: 9,  directLimit: 100},
  {title: "entrepreneur", collateralReq: 20,  directReq: 200,  trustReq: 10, directLimit: 200},
  {title: "tycoon",       collateralReq: 50,  directReq: 500,  trustReq: 10, directLimit: 500},
  {title: "elite",        collateralReq: 100, directReq: 1000, trustReq: 10, directLimit: 1000}
]

const tokenSymbols = ["ETH", "DAI", "USDC"]

module.exports.calculateTraderStatistics = async (account, allTraders) => {

	let investments = await investMysql.getByTrader(account)
	investments = investments.map(mapInvest)

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

	for (let i=0; i<investments.length; i++) {
		await setInvestmentValue(investments[i])

		//console.log("calculateTraderStatistics", investments[i])
	}

	const counts = await calculateInvestmentCounts(investments)
	const trustRating = await calculateTrustRating(account, investments, moment())
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
		investments[i] = mapInvest(investments[i])
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

	// const rejectExits = await rejectExitMysql.getByInvestor(account)

	// rejectExits.forEach((rejectExit) => {
	// 	let index = investments.findIndex(investment => investment.investmentId === rejectExit.investmentId)
	// 	if (index !== -1) {
	// 		investments[index] = {
	// 			...investments[index],
	// 			...mapRejectExit(rejectExit)
	// 		}
	// 	}
	// })

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

	for (let i=0; i<investments.length; i++) {
		await setInvestmentValue(investments[i])
	}

	const counts = await calculateInvestmentCounts(investments)

	return {
		counts: counts
	}
}

module.exports.calculatePublicStatistics = async () => {
	let traderCount = 0
	let investorCount = 0
	let investments = []

	let traders = await traderMysql.list()
	for (let i=0; i<traders.length; i++) {
		let trader = traders[i]
		trader = mapTrader(trader)

		trader.allocation = {}
		let hasAllocation = false

		for (let t=0; t<helpers.userTokens.length; t++) {

			let token = helpers.userTokens[t]

			trader.allocation[token.symbol] = {}
			let allocation = trader.allocation[token.symbol]


			let lastAllocate = await allocateMysql.getLastForTraderAndToken(trader.user, token.address)
			if (lastAllocate) {
				lastAllocate = mapAllocate(lastAllocate)
				allocation.total = lastAllocate.total

				if (!hasAllocation) {
					hasAllocation = lastAllocate.total.gt(0)
				}
			} else {
				allocation.total = new BigNumber(0)
			}

		}

		if (hasAllocation) {
			traderCount++

			const traderStats = await traderStatisticsDao.getStatistics(trader.user)
			if (traderStats) {
				for (let t=0; t<helpers.userTokens.length; t++) {

					const token = helpers.userTokens[t]

					for (let invType = 0; invType <= 1; invType++) {
						const invState = ["approved", "pending", "active"]

						for (let stateIdx = 0; stateIdx < invState.length; stateIdx++) {
							const posNeg = ["positive", "negative"]

							for (let sideIdx = 0; sideIdx < posNeg.length; sideIdx++) {
								const propertyPath = `counts.${token.symbol}.${invType}.${invState[stateIdx]}.${posNeg[sideIdx]}`
								//console.log('propertyPath', propertyPath)

								let grossProfit = _.get(traderStats, propertyPath + '.totalGrossProfit', null)
								let count = _.get(traderStats, propertyPath + '.count', null)

								if (grossProfit && count) {
									grossProfit = new BigNumber(grossProfit)

									if (posNeg[sideIdx] == "negative") {
										grossProfit = grossProfit.negated()
									}

									let investmentGroup = _.find(investments, ig => ig.asset === token.symbol)

									if (!investmentGroup) {
										investmentGroup = {
											asset: token.symbol,
											count: count,
											profit: grossProfit
										}
										investments.push(investmentGroup)
									} else {
										investmentGroup.count += count
										investmentGroup.profit = investmentGroup.profit.plus(grossProfit)
									}
								}
							}
						}
					}
				}
			}
		}
	}

	let investors = await investorMysql.list()
	for (let i=0; i<investors.length; i++) {
		// investors[i] = mapInvestor(investors[i])

		investorCount++
	}

	for (let i=0; i<investments.length; i++) {
		investments[i].profit = investments[i].profit.toString()
	}

	traders = traders.map((trader) => {
		return {
			user: trader.user
		}
	})

	console.log("traderCount", traderCount)
	console.log("investorCount", investorCount)
	console.log("investments", investments)
	console.log("traders", traders)

	return {
		traderCount: traderCount,
		investorCount: investorCount,
		investments: investments,
		traders: traders
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
			incrementInvestmentCount(counter, "approved", investment)
		} else if (investment.rejectFrom) {
			// rejected
			incrementInvestmentCount(counter, "rejected", investment)
		} else if (investment.requestFrom || investment.stopFrom) {
			// pending
			incrementInvestmentCount(counter, "pending", investment)
		} else {
			// active
			incrementInvestmentCount(counter, "active", investment)
		}
	})

	return investmentCounts
}
module.exports.calculateInvestmentCounts = calculateInvestmentCounts

const incrementInvestmentCount = (counter, state, investment) => {
	if (!counter[state]) {
		counter[state] = {}
	}

	let side = "positive"

	if (!investment.grossProfit.isPositive()) {
		side = "negative"
	}

	if (!counter[state][side]) {
		counter[state][side] = {
			"count": 1, 
			"totalGrossProfit": investment.grossProfit.abs().toString(),
			"totalInvestorProfit": investment.investorProfit.abs().toString(),
			"totalTraderProfit": investment.traderProfit.abs().toString()}
	} else {
		counter[state][side].count = counter[state][side].count + 1
		counter[state][side].totalGrossProfit = new BigNumber(counter[state][side].totalGrossProfit).plus(investment.grossProfit.abs()).toString()
		counter[state][side].totalInvestorProfit = new BigNumber(counter[state][side].totalInvestorProfit).plus(investment.investorProfit.abs()).toString()
		counter[state][side].totalTraderProfit = new BigNumber(counter[state][side].totalTraderProfit).plus(investment.traderProfit.abs()).toString()
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
module.exports.calculateLevel = calculateLevel

const calculateTrustRating = async (account, investments, now) => {

	let total = 0
	let badValues = []
	let pastLateApprovals = []
	let currentLateApprovals = []

	investments.forEach((investment) => {

		if (investment.requestFrom) {
			total = total + 1

			if (investment.requestFrom === account) {
				// trader requested exit, check value
				if (investment.value.lt(investment.grossValue)) {
					// trader requested wrong value, too small
					let daysSince = now.diff(investment.requestExitDate, 'days')
					if (daysSince < ONE_YEAR_DAYS) {
						badValues.push(ONE_YEAR_DAYS - daysSince)
					}
				}

			} else {
				// investor requested exit
				if (investment.approveFrom) {
					if (investment.approveExitDate.diff(investment.requestExitDate) > ONE_WEEK_MS) {

						let daysSince = now.diff(investment.approveExitDate, 'days')
						if (daysSince < ONE_YEAR_DAYS) {
							pastLateApprovals.push(ONE_YEAR_DAYS - daysSince)
						}
					}

				} else if (investment.rejectFrom) {
					if (investment.rejectValue.lt(investment.grossValue)) {
						// trader rejected with wrong value
						let daysSince = now.diff(investment.rejectExitDate, 'days')
						if (daysSince < ONE_YEAR_DAYS) {
							badValues.push(ONE_YEAR_DAYS - daysSince)
						}
					}
				} else {
					// still waiting
					if (now.diff(investment.requestExitDate) > ONE_WEEK_MS) {
						currentLateApprovals.push(now.diff(investment.requestExitDate, 'days'))
					}	
				}
			}
		}
	})

	let trustRating = 10

	if (total > 0) {

		let penalty = getPenaltyScore(badValues, 2)
		penalty += getPenaltyScore(pastLateApprovals, 0.1)
		penalty += getPenaltyScore(currentLateApprovals, 100)

		if (penalty > 10) {
			penalty = 10
		}

		trustRating = 10 - penalty
	}

	// console.log("trustRating", trustRating)

	return trustRating
}
module.exports.calculateTrustRating = calculateTrustRating

const getPenaltyScore = (scores, weight) => {
	let score = scores.reduce((total, value) => {
		return total + (value / ONE_YEAR_DAYS) * weight
	}, 0)

	return score
}

const calculateLimits = async (account, investments, level) => {
	let latestApproval
	let investmentDirectTotals = []
	let directLimits = {}
	let directInvested = {}

	investments.forEach((investment) => {
		
		if (investment.approveFrom) {
			// if (investment.nettValue.minus(investment.amount).gt(0)) {
				if (!latestApproval || investment.startDate.isAfter(latestApproval)) {
					latestApproval = investment.startDate
				}
			// }
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
module.exports.calculateLimits = calculateLimits

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

			const relativeProfit = trade.profit
				.dividedBy(trade.initialAmount)
				.dividedBy(trade.end.diff(trade.start, 'days', true))
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
module.exports.calculateTradingRatings = calculateTradingRatings

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
			investments[i] = mapInvest(investments[i])
		}

		const stops = await stopMysql.getByTrader(trader.user)

		stops.forEach((stop) => {
			// console.log("Stop", stop)
			let index = investments.findIndex(investment => investment.investmentId === stop.investmentId)
			// console.log ("index", index)
			if (index !== -1) {
				investments[index] = {
					...investments[index],
					...mapStop(stop)
				}
			}
		})

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
			await setInvestmentValue(investment)

			// console.log("calculateProfitRatings - investment", investment)
			const tokenSymbol = helpers.tokenSymbolForAddress(investment.token)

			const relativeProfit = (investment.nettValue.minus(investment.amount))
				.dividedBy(investment.amount)
				.dividedBy(investment.endDate.diff(investment.startDate, 'days', true))
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
module.exports.calculateProfitRatings = calculateProfitRatings

const mapTrade = (trade) => {
	return {
		...trade,
		start: moment.unix(trade.start),
		end: moment.unix(trade.end),
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

module.exports.getTotalInvestedForInvestment = async (investment) => {

	let investments = await getTraderDirectInvestmentsBefore(investment.trader, investment.token, investment.startDate)

	let totalAmount = new BigNumber(investment.amount)
	totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), totalAmount)
	
	return totalAmount
}

const getTraderDirectInvestmentsBefore = async (account, token, startDate) => {
	
	let investments = await investMysql.getDirectByTraderAndTokenBefore(account, token, startDate)

	let i = investments.length
	while (i--) {
	    investments[i] = mapInvest(investments[i])
	    const stop = await stopMysql.getByInvestmentId(investments[i].investmentId)

	    console.log("getDirectByTraderAndTokenBefore", stop)

	    if (stop && stop.eventDate <= startDate) { 
	    	// investment was stopped before the reference one started
	    	// so remove it
	        investments.splice(i, 1);
	    } else {
	    	investments[i] = {
				...investments[i],
				// ...mapStop(stop)
			}
	    }
	}

	return investments
}

const setInvestmentValue = async (investment) => {

	// console.log("setInvestmentValue", investment)
	
	let traderProfitPercent = new BigNumber(1)

	let investorProfitPercent = investment.investorProfitPercent.dividedBy(10000)
	traderProfitPercent = traderProfitPercent.minus(investorProfitPercent)

	// get all trades for this investment
	let trades = await tradesController.getTrades(investment.trader)

	trades = trades.filter(
		(trade) => helpers.tokenAddressForSymbol(trade.asset) === investment.token)

	trades = trades.filter(trade =>
		trade.start.isAfter(investment.startDate) 
			&& (
				(investment.endDate.unix() === 0 || investment.state === helpers.INVESTMENT_STATE_INVESTED) 
					|| trade.end.isBefore(investment.endDate)))

	// console.log("P", trades)


	let allocations = await allocateMysql.getByTraderAndToken(investment.trader, investment.token)
	allocations = allocations.map(mapAllocate)

	const traderInvestments = await getTraderInvestments(investment.trader, investment.token)

	// console.log("traderInvestments", traderInvestments)

	// for each trade get all investments that it should be split over
	// and calculate profit/loss
	let grossProfit = new BigNumber(0)
	for (let i=0; i<trades.length; i++) {
		const trade = trades[i]


		// find the allocation just before the start of this trade
		let allocation = allocations.find(allocation => allocation.eventDate.isBefore(trade.start))

		// Fallback to the last allocation made, but there should be an allocation made before the trade started
		// TODO: maybe remove?
		if (!allocation) {
			allocation = allocations[0]
		}

		// console.log("allocation", allocation, allocation.total.toString(), allocation.invested.toString())

		// console.log("trade.profit", trade.profit.toString())
		let {totalAmount, totalLimit} = await getTradeInvestmentsAmountAndTotalLimit(trade, allocation, investment, traderInvestments)
		// console.log("totalAmount, totalLimit", totalAmount.toString(), totalLimit.toString())

		let investorsShare = totalAmount.dividedBy(totalLimit)
		// console.log("investorsShare", investorsShare.toString())

		// split profit according to share of total amount
		let sharePercentage = investment.amount.dividedBy(totalAmount)
		// console.log("sharePercentage", sharePercentage.toString())

		let tradeProfit = trade.profit.multipliedBy(sharePercentage).multipliedBy(investorsShare)
		// console.log("tradeProfit", tradeProfit.toString())

		grossProfit = grossProfit.plus(tradeProfit)
	}

	if (investment.amount.plus(grossProfit).isNegative()) {
		// if losses would amount to a negative valuation, just make the loss equal to the investment amount
		grossProfit = investment.amount.negated()
	}

	let investorProfit = grossProfit
	if (grossProfit.isPositive()) {
		investorProfit = investorProfit.multipliedBy(investorProfitPercent).multipliedBy(0.99)
	}

	let traderProfit = grossProfit.multipliedBy(traderProfitPercent).multipliedBy(0.99)

	console.log("grossProfit", grossProfit.toString())
	console.log("investorProfit", investorProfit.toString())
	console.log("traderProfit", traderProfit.toString())
	investment.grossValue = investment.amount.plus(grossProfit)
	investment.nettValue = investment.amount.plus(investorProfit)

	investment.grossProfit = grossProfit
	investment.investorProfit = investorProfit
	investment.traderProfit = traderProfit

	console.log("grossValue", investment.grossValue.toString())
	console.log("nettValue", investment.nettValue.toString())

	return investment
}
module.exports.setInvestmentValue = setInvestmentValue

const getTradeInvestmentsAmountAndTotalLimit = async (trade, allocation, investment, traderInvestments) => {
	let investments = traderInvestments.filter((inv) => trade.asset === helpers.tokenSymbolForAddress(inv.token))
	
	investments = traderInvestments.filter(inv =>
		trade.start.isAfter(inv.startDate) 
			&& (
				(inv.endDate.unix() === 0 || inv.state === helpers.INVESTMENT_STATE_INVESTED) 
					|| trade.end.isBefore(inv.endDate)))

	console.log("getTradeInvestmentsAmountAndTotalLimit investments", investments)
	
	// totalAmount is the total of all investment amounts for this trade
	let totalAmount = investments.reduce((total, inv) => total.plus(inv.amount), new BigNumber(0))

	let addedAllocationTotal = false

	// totalLimit is the upper limit across which profits will be divided for this trade.
	// in the case of collateral investments, it's the collateral limit set at the time of investment
	// but we also have to include all direct investment amounts, since they add to the ceiling
	let totalLimit = investments.reduce((total, inv) => {

		if (inv.investmentType === helpers.INVESTMENT_DIRECT) {
			return total.plus(inv.amount)
		} else if (!addedAllocationTotal) {
			addedAllocationTotal = true
			return total.plus(allocation.total)
		} else {
			return total
		}
	}, new BigNumber(0))

	return {totalAmount, totalLimit}
}

const getTraderInvestments = async (account, token) => {
	
	let investments = await investMysql.getByTraderAndToken(account, token)
	for (let i=0; i<investments.length; i++) {
		investments[i] = mapInvest(investments[i])

		const stop = await stopMysql.getByInvestmentId(investments[i].investmentId)

		if (stop) {
			investments[i] = {
				...investments[i],
				...mapStop(stop)
			}
		}

		const requestExit = await requestExitMysql.getByInvestmentId(investments[i].investmentId)

		if (requestExit) {
			investments[i] = {
				...investments[i],
				...mapRequestExit(requestExit)
			}
		}

		const rejectExit = await rejectExitMysql.getByInvestmentId(investments[i].investmentId)

		if (rejectExit) {
			investments[i] = {
				...investments[i],
				...mapRejectExit(rejectExit)
			}
		}

		const approveExit = await approveExitMysql.getByInvestmentId(investments[i].investmentId)

		if (approveExit) {
			investments[i] = {
				...investments[i],
				...mapApproveExit(approveExit)
			}
		}
	}

	return investments
}

const mapInvest = (event) => {

	let investment = {
		...event,
		amount: new BigNumber(event.amount),
		value: new BigNumber(event.amount),
		grossValue: new BigNumber(event.amount),
		nettValue: new BigNumber(event.amount),
		investorProfitPercent: new BigNumber(event.investorProfitPercent),
		startDate: moment.unix(event.eventDate).utc(),
		endDate: moment.unix(0).utc(),
		invested: new BigNumber(event.invested),
		state: helpers.INVESTMENT_STATE_INVESTED
	}

	return investment
}

const mapStop = (event) => {
	return {
		...event,
		endDate: moment.unix(event.eventDate).utc(),
		eventDate: moment.unix(event.eventDate).utc(),
		state: helpers.INVESTMENT_STATE_STOPPED
	}
}

const mapRequestExit = (event) => {

	let state = helpers.INVESTMENT_STATE_EXITREQUESTED_INVESTOR
	if (event.requestFrom === event.trader) {
		state = helpers.INVESTMENT_STATE_EXITREQUESTED_TRADER
	}

	return {
		...event,
		value: new BigNumber(event.value),
		requestExitDate: moment.unix(event.eventDate).utc(),
		state: state
	}
}

const mapRejectExit = (event) => {
	return {
		...event,
		rejectValue: new BigNumber(event.value),
		rejectExitDate: moment.unix(event.eventDate).utc(),
		state: helpers.INVESTMENT_STATE_STOPPED
	}
}

const mapApproveExit = (event) => {
	return {
		...event,
		approveExitDate: moment.unix(event.eventDate).utc(),
		state: helpers.INVESTMENT_STATE_EXITAPPROVED
	}
}

const mapTrader = (event) => {
	return {
		...event,
		eventDate: moment.unix(event.eventDate).utc()
	}
}

const mapInvestor = (event) => {
	return {
		...event,
		eventDate: moment.unix(event.eventDate).utc()
	}
}

const getPublicStatistics = async () => {

}
module.exports.getPublicStatistics = getPublicStatistics
