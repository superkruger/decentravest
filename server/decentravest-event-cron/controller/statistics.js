
const BigNumber = require('bignumber.js')
const moment = require('moment')

const tradesController = require('./trades')

const investMysql = require('../mysql/traderpaired/invest')
const stopMysql = require('../mysql/traderpaired/stop')
const requestExitMysql = require('../mysql/traderpaired/requestExit')
const rejectExitMysql = require('../mysql/traderpaired/rejectExit')
const approveExitMysql = require('../mysql/traderpaired/approveExit')

const helpers = require('../helpers')

const tokenSymbols = ["ETH", "DAI", "USDC"]

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
	    investments[i] = await mapInvest(investments[i])
	    const stop = await stopMysql.getByInvestmentId(investments[i].investmentId)

	    console.log("getDirectByTraderAndTokenBefore", stop)

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

	console.log("setInvestmentValue", investment)
	
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

	const traderInvestments = await getTraderInvestments(investment.trader, investment.token)

	// console.log("traderInvestments", traderInvestments)

	// for each trade get all investments that it should be split over
	// and calculate profit/loss
	let grossProfit = new BigNumber(0)
	for (let i=0; i<trades.length; i++) {
		const trade = trades[i]

		// console.log("trade.profit", trade.profit.toString())
		let {totalAmount, totalLimit} = await getTradeInvestmentsAmountAndTotalLimit(trade, investment, traderInvestments)
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

	investment.grossProfit = grossProfit.toString()
	investment.investorProfit = investorProfit.toString()
	investment.traderProfit = traderProfit.toString()

	console.log("grossValue", investment.grossValue.toString())
	console.log("nettValue", investment.nettValue.toString())

	return investment
}
module.exports.setInvestmentValue = setInvestmentValue

const getTradeInvestmentsAmountAndTotalLimit = async (trade, investment, traderInvestments) => {
	// let investments = traderInvestments.filter((inv) => trade.asset === helpers.tokenSymbolForAddress(inv.token))
	
	let investments = traderInvestments.filter(inv =>
		trade.start.isAfter(inv.startDate) 
			&& (
				(inv.endDate.unix() === 0 || inv.state === helpers.INVESTMENT_STATE_INVESTED) 
					|| trade.end.isBefore(inv.endDate)))
	
	// totalAmount is the total of all investment amounts for this trade
	let totalAmount = investments.reduce((total, inv) => total.plus(inv.amount), new BigNumber(0))

	// totalLimit is the upper limit across which profits will be divided for this trade
	// in the case of collateral investments, it's the collateral limit set at the time of investment
	// but we also have to include all direct investment amounts, since they add to the ceiling
	let totalLimit = investments.reduce((total, inv) => {

		if (inv.investmentId === investment.id) {
			return total.plus(investment.traderLimit)
		} else if (inv.investmentType === helpers.INVESTMENT_DIRECT) {
			return total.plus(inv.amount)
		} else {
			return total
		}
	}, new BigNumber(0))

	return {totalAmount, totalLimit}
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

