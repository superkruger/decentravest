
const BigNumber = require('bignumber.js')
const moment = require('moment')

const tradesController = require('./trades')

const investDao = require('../dao/traderpaired/invest')
const stopDao = require('../dao/traderpaired/stop')
const requestExitDao = require('../dao/traderpaired/requestExit')
const rejectExitDao = require('../dao/traderpaired/rejectExit')
const approveExitDao = require('../dao/traderpaired/approveExit')

const helpers = require('../helpers')

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

module.exports.getTotalInvestedForInvestment = async (investment) => {

	let investments = await getTraderDirectInvestmentsBefore(investment.trader, investment.token, investment.startDate)

	let totalAmount = new BigNumber(investment.amount)
	totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), totalAmount)
	
	return totalAmount

	// const trustRating = await calculateTrustRating(investment.trader, investments)
	// const level = await calculateLevel(investments, trustRating)
	// const limits = await calculateLimits(investment.trader, investments, level)

	// return {
	// 	trustRating: trustRating,
	// 	level: level,
	// 	limits: limits
	// }
}

const getTraderDirectInvestmentsBefore = async (account, token, startDate) => {
	
	let investments = await investDao.getByTraderAndTokenBefore(account, token, startDate)

	let i = investments.length
	while (i--) {
	    investments[i] = await mapInvest(investments[i])
	    const stop = await stopDao.getByInvestmentId(investments[i].id)

	    console.log("getTraderDirectInvestmentsBefore", stop)

	    if (stop && stop.eventDate <= startDate) { 
	    	// investment was stopped before the reference one started
	    	// so remove it
	        investments.splice(i, 1);
	    } else {
	    	investments[i] = {
				...investments[i],
				...mapStop(stop)
			}
	    }
	}

	return investments
}

// const calculateTrustRating = async (account, investments) => {

// 	let total = 0
// 	let bad = 0

// 	investments.forEach(async (investment) => {

// 		if (investment.requestFrom) {
// 			total = total + 1

// 			if (investment.requestFrom === account) {
// 				// trader requested exit, check value
// 				if (investment.grossValue.lt(investment.value)) {
// 					// trader requested wrong value
// 					bad = bad + 1
// 				}

// 			} else {
// 				// investor requested exit
// 				let now = moment()
// 				if (investment.approveFrom) {
// 					if (investment.approveExitDate.diff(investment.requestExitDate) > 48 * 60 * 60 * 1000) {
// 						bad = bad + 1
// 					}

// 				} else if (investment.rejectFrom) {
// 					if (investment.grossValue.lt(investment.rejectValue)) {
// 						// trader rejected wrong value
// 						// console.log("trader rejected with wrong value", investment.grossValue.toString(), investment.value.toString(), investment.rejectValue.toString())
// 						bad = bad + 1
// 					}
// 				} else {
// 					// still waiting
// 					if (now.diff(investment.requestExitDate) > 48 * 60 * 60 * 1000) {
// 						bad = bad + 1
// 					}
// 				}
// 			}
// 		}
// 	})

// 	let trustRating = new BigNumber(0)

// 	if (total > 0) {
// 		trustRating = new BigNumber(total - bad).dividedBy(total).multipliedBy(10)
// 	}

// 	return trustRating.toString()
// }

// const calculateLevel = async (investments, trustRating) => {
// 	let collateralApprovalCount = 0
// 	let directApprovalCount = 0

// 	investments.forEach(async (investment) => {
// 		// if approved and profitable
// 		if (investment.approveFrom) {
			
// 			if (investment.nettValue.minus(investment.amount).gt(0)) {
// 				if (investment.investmentType === helpers.INVESTMENT_DIRECT) {
// 					directApprovalCount = directApprovalCount + 1
// 				} else {
// 					collateralApprovalCount = collateralApprovalCount + 1
// 				}
// 			}
// 		}
// 	})

// 	let level = levelRequirements.length - 1
// 	for (; level >= 0; level--) {
// 		if (collateralApprovalCount >= levelRequirements[level].collateralReq &&
// 			directApprovalCount >= levelRequirements[level].directReq &&
// 			trustRating >= levelRequirements[level].trustReq) {
// 			break;
// 		}
// 	}

// 	return level
// }

// const calculateLimits = async (account, investments, level) => {
// 	let latestApproval
// 	let investmentDirectTotals = []
// 	let directLimits = {}
// 	let directInvested = {}

// 	investments.forEach(async (investment) => {
		
// 		if (investment.approveFrom) {
// 			if (!latestApproval || investment.start.isAfter(latestApproval)) {
// 				latestApproval = investment.start
// 			}
// 		} else {
// 			if (investment.investmentType === helpers.INVESTMENT_DIRECT) {
// 				if (investmentDirectTotals[investment.token]) {
// 					investmentDirectTotals[investment.token] = investmentDirectTotals[investment.token].plus(investment.amount)
// 				} else {
// 					investmentDirectTotals[investment.token] = investment.amount
// 				}
// 			}
// 		}
// 	})

// 	if (latestApproval) {
// 		// get allocations just before this
// 		for (let i=0; i<helpers.userTokens.length; i++) {
// 			const token = helpers.userTokens[i]

// 			let allocations = await allocateDao.getByTraderAndToken(account, token.address)
// 			allocations = allocations.map(mapAllocate)

// 			// find the allocation just before the start of this investment
// 			const allocation = allocations.find(allocation => allocation.eventDate.isBefore(latestApproval))

// 			if (allocation) {
// 				// calculate direct investment limit
// 				let directLimit = allocation.total.multipliedBy(levelRequirements[level].directLimit)
				
// 				let directInvestment = investmentDirectTotals[token.address]
// 				if (!directInvestment) {
// 					directInvestment = new BigNumber(0)
// 				}
// 				directLimits[helpers.tokenSymbolForAddress(allocation.token)] = directLimit.toString()
// 				directInvested[helpers.tokenSymbolForAddress(allocation.token)] = directInvestment.toString()
// 			}
// 		}
// 	}

// 	return {
// 		directLimits: directLimits,
// 		directInvested: directInvested
// 	}
// }


///


const setInvestmentValue = async (investment) => {
	
	let investorProfitPercent = investment.investorProfitPercent.dividedBy(10000)

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

	const traderInvestments = await getTraderInvestments(investment.trader, investment.token)

	// console.log("traderInvestments", traderInvestments)

	// for each trade get all investments that it should be split over
	// and calculate profit/loss
	let grossProfit = new BigNumber(0)
	await trades.forEach(async (trade) => {

		// console.log("trade.profit", trade.profit.toString())
		let totalAmount = await getTradeInvestmentsAmount(trade, traderInvestments)
		// console.log("totalAmount", totalAmount.toString())

		let investorsShare = totalAmount.dividedBy(investment.traderLimit)
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
module.exports.setInvestmentValue = setInvestmentValue

const getTradeInvestmentsAmount = async (trade, traderInvestments) => {
	let investments = traderInvestments.filter((investment) => trade.asset === helpers.tokenSymbolForAddress(investment.token))
	
	investments = investments.filter(investment =>
		trade.start.isAfter(investment.startDate) 
			&& (
				(investment.endDate.unix() === 0 || investment.state === helpers.INVESTMENT_STATE_INVESTED) 
					|| trade.end.isBefore(investment.endDate)))
	
	let totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), new BigNumber(0))
	return totalAmount
}

const getTraderInvestments = async (account, token) => {
	
	let investments = await investDao.getByTraderAndToken(account, token)
	for (let i=0; i<investments.length; i++) {
		investments[i] = await mapInvest(investments[i])

		const stop = await stopDao.getByInvestmentId(investments[i].id)

		if (stop) {
			investments[i] = {
				...investments[i],
				...mapStop(stop)
			}
		}

		const requestExit = await requestExitDao.getByInvestmentId(investments[i].id)

		if (requestExit) {
			investments[i] = {
				...investments[i],
				...mapRequestExit(requestExit)
			}
		}

		const rejectExit = await rejectExitDao.getByInvestmentId(investments[i].id)

		if (rejectExit) {
			investments[i] = {
				...investments[i],
				...mapRejectExit(rejectExit)
			}
		}

		const approveExit = await approveExitDao.getByInvestmentId(investments[i].id)

		if (approveExit) {
			investments[i] = {
				...investments[i],
				...mapApproveExit(approveExit)
			}
		}
	}

	return investments
}

const mapInvest = async (event) => {

	let investment = {
		...event,
		amount: new BigNumber(event.amount),
		value: new BigNumber(event.amount),
		grossValue: new BigNumber(event.amount),
		nettValue: new BigNumber(event.amount),
		investorProfitPercent: new BigNumber(event.investorProfitPercent),
		investmentType: parseInt(event.investmentType, 10),
		startDate: moment.unix(event.eventDate).utc(),
		endDate: moment.unix(0).utc(),
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
	if (event.from === event.trader) {
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

