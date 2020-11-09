
const BigNumber = require('bignumber.js')
const moment = require('moment')

const tradesController = require('./trades')

const investMysql = require('../mysql/traderpaired/invest')
const stopMysql = require('../mysql/traderpaired/stop')
const requestExitMysql = require('../mysql/traderpaired/requestExit')
const rejectExitMysql = require('../mysql/traderpaired/rejectExit')
const approveExitMysql = require('../mysql/traderpaired/approveExit')

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
}

const getTraderDirectInvestmentsBefore = async (account, token, startDate) => {
	
	let investments = await investMysql.getByTraderAndTokenBefore(account, token, startDate)

	let i = investments.length
	while (i--) {
	    investments[i] = await mapInvest(investments[i])
	    const stop = await stopMysql.getByInvestmentId(investments[i].investmentId)

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
	
	let investments = await investMysql.getByTraderAndToken(account, token)
	for (let i=0; i<investments.length; i++) {
		investments[i] = await mapInvest(investments[i])

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

const mapInvest = async (event) => {

	let investment = {
		...event,
		amount: new BigNumber(event.amount),
		value: new BigNumber(event.amount),
		grossValue: new BigNumber(event.amount),
		nettValue: new BigNumber(event.amount),
		investorProfitPercent: new BigNumber(event.investorProfitPercent),
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

