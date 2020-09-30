
const BigNumber = require('bignumber.js')
const moment = require('moment')

const traderDao = require('./dao/traderpaired/trader')
const investDao = require('./dao/traderpaired/invest')
const investorDao = require('./dao/traderpaired/investor')
const requestExitDao = require('./dao/traderpaired/requestExit')
const rejectExitDao = require('./dao/traderpaired/rejectExit')
const approveExitDao = require('./dao/traderpaired/approveExit')
const allocateDao = require('./dao/traderpaired/allocate')
const stopDao = require('./dao/traderpaired/allocate')

const positionsDao = require('./dao/dydx/positions')
const ratingsDao = require('./dao/ratings')

const helpers = require('./helpers')

module.exports.calculateTradingRatings = async (account, allTraders) => {

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
		WETH: "0",
		DAI: "0",
		USDC: "0"
	}

	let assets = ["WETH", "DAI", "USDC"]

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {
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

		let positions = await positionsDao.getByOwner(trader.user)

		for (let positionIndex=0; positionIndex<positions.length; positionIndex++) {
			let position = positions[positionIndex]

			const relativeProfit = position.dv_profit.dividedBy(position.dv_initialAmount)

			traderTotal[position.dv_asset] = traderTotal[position.dv_asset].plus(relativeProfit)
			traderCnt[position.dv_asset] = traderCnt[position.dv_asset] + 1

			if (trader.user === account) {
				accountTotal[position.dv_asset] = traderTotal[position.dv_asset]
				accountCnt[position.dv_asset] = traderCnt[position.dv_asset]
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
							ratings[asset] = "0"
						} else {
							if (allHigh[asset].isEqualTo(allLow[asset])) {
								ratings[asset] = "10"
							} else {
								ratings[asset] = ((accountAvg[asset].minus(allLow[asset])).dividedBy(allHigh[asset].minus(allLow[asset]))).multipliedBy(10).toString()
							}
						}
					})

					// dispatch(traderRatingsLoaded(account, ratings))
					// await positionsDao.saveRatings(account, ratings)
					return ratings
				}
			}
		}
	}
	return null
}

module.exports.calculateProfitRatings = async (account, allTraders) => {
	let allLow = {
		ETH: null,
		DAI: null,
		USDC: null
	}
	let allHigh = {
		ETH: null,
		DAI: null,
		USDC: null
	}

	let accountAvg = {
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

	let assets = ["ETH", "DAI", "USDC"]

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {
		let trader = allTraders[traderIndex]

		let traderAvg = {
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

		let investments = await investDao.getByTrader(trader.user)
		investments = investments.map(mapInvest)

		const requestExits = await requestExitDao.getByTrader(trader.user)

		requestExits.forEach((requestExit) => {
			console.log("RequestExit", requestExit)
			let index = investments.findIndex(investment => investment.id === requestExit.id)
			console.log ("index", index)
			if (index !== -1) {
				investments[index] = {
					...investments[index],
					...mapRequestExit(requestExit)
				}
			}
		})

		const approveExits = await approveExitDao.getByTrader(trader.user)

		approveExits.forEach((approveExit) => {
			let index = investments.findIndex(investment => investment.id === approveExit.id)
			if (index !== -1) {
				investments[index] = {
					...investments[index],
					...mapApproveExit(approveExit)
				}
			}
		})


		for (let investmentIndex=0; investmentIndex<investments.length; investmentIndex++) {
			let investment = investments[investmentIndex]
			const tokenSymbol = helpers.tokenSymbolForAddress(investment.token)

			console.log("tokenSymbol", tokenSymbol)

			investment = await getInvestmentValue(investment)

			const relativeProfit = investment.nettValue.dividedBy(investment.amount)

			traderTotal[tokenSymbol] = traderTotal[tokenSymbol].plus(relativeProfit)
			traderCnt[tokenSymbol] = traderCnt[tokenSymbol] + 1

			if (trader.user === account) {
				accountTotal[tokenSymbol] = traderTotal[tokenSymbol]
				accountCnt[tokenSymbol] = traderCnt[tokenSymbol]
			}
			
			if (investmentIndex === (investments.length - 1)) {
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
							ratings[asset] = "0"
						} else {
							if (allHigh[asset].isEqualTo(allLow[asset])) {
								ratings[asset] = "10"
							} else {
								ratings[asset] = ((accountAvg[asset].minus(allLow[asset])).dividedBy(allHigh[asset].minus(allLow[asset]))).multipliedBy(10).toString()
							}
						}
					})

					// dispatch(traderRatingsLoaded(account, ratings))
					// await positionsDao.saveRatings(account, ratings)
					console.log("profitRatings", ratings)
					return ratings
				}
			}
		}
	}
	return null
}

module.exports.calculateTrustRating = async (account) => {

	let investments = await investDao.getByTrader(account)
	investments = investments.map(mapInvest)
	
	console.log("loadTraderTrustRating - Invest", investments)

	const requestExits = await requestExitDao.getByTrader(account)

	requestExits.forEach((requestExit) => {
		console.log("RequestExit", requestExit)
		let index = investments.findIndex(investment => investment.id === requestExit.id)
		console.log ("index", index)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapRequestExit(requestExit)
			}
		}
	})

	console.log("loadTraderTrustRating - RequestExit", investments)

	const approveExits = await approveExitDao.getByTrader(account)

	approveExits.forEach((approveExit) => {
		let index = investments.findIndex(investment => investment.id === approveExit.id)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapApproveExit(approveExit)
			}
		}
	})

	console.log("loadTraderTrustRating - ApproveExit", investments)

	const rejectExits = await rejectExitDao.getByTrader(account)

	rejectExits.forEach((rejectExit) => {
		let index = investments.findIndex(investment => investment.id === rejectExit.id)
		if (index !== -1) {
			investments[index] = {
				...investments[index],
				...mapRejectExit(rejectExit)
			}
		}
	})

	console.log("loadTraderTrustRating - RejectExit", investments)

	let total = 0
	let bad = 0
	let latestApproval = null
	let collateralApprovalCount = 0
	let directApprovalCount = 0
	let investmentDirectTotals = []

	investments.forEach(async (investment) => {
		console.log("Checking investment", investment)

		if (!investment.approveFrom) {
			if (investmentDirectTotals[investment.token]) {
				investmentDirectTotals[investment.token] = investmentDirectTotals[investment.token].plus(investment.amount)
			} else {
				investmentDirectTotals[investment.token] = investment.amount
			}
		}

		if (investment.requestFrom) {
			total = total + 1

			if (investment.approveFrom) {
				if (!latestApproval || investment.start.isAfter(latestApproval)) {
					latestApproval = investment.start
				}

				if (investment.investmentType === helpers.INVESTMENT_DIRECT) {
					directApprovalCount = directApprovalCount + 1
				} else {
					collateralApprovalCount = collateralApprovalCount + 1
				}
			}

			console.log("Total", total)
			if (investment.requestFrom === account) {
				// trader requested exit, check value
				investment = await getInvestmentValue(investment)
				console.log("Investment Value", investment)
				if (investment.grossValue.lt(investment.value)) {
					// trader requested wrong value
					console.log("trader requested wrong value", investment.grossValue.toString(), investment.value.toString())
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
					investment = await getInvestmentValue(investment)
					if (investment.grossValue.lt(investment.rejectValue)) {
						// trader rejected wrong value
						console.log("trader rejected with wrong value", investment.grossValue.toString(), investment.value.toString(), investment.rejectValue.toString())
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

	if (total > 0) {
		const trustRating = new BigNumber(total - bad).dividedBy(total).multipliedBy(10)
		let directLimits = []

		console.log("getting token direct limits", latestApproval, trustRating.toString(), helpers.userTokens)

		if (latestApproval && trustRating.gt(8)) {
			// get allocations just before this
			for (let i=0; i<helpers.userTokens.length; i++) {
				const token = helpers.userTokens[i]

				console.log("userTokens", token)
				let allocations = await allocateDao.getByTraderAndToken(account, token.address)
				allocations = allocations.map(mapAllocate)

				// find the allocation just before the start of this investment
				const allocation = allocations.find(allocation => allocation.eventDate.isBefore(latestApproval))

				if (allocation) {
					// calculate direct investment limit
					let directLimit = allocation.total.multipliedBy(collateralApprovalCount / 10)
					if (directApprovalCount > 0) {
						directLimit = directLimit.plus(allocation.total.multipliedBy(directApprovalCount / 5))
					}

					let directInvested = investmentDirectTotals[token.address]
					if (!directInvested) {
						directInvested = new BigNumber(0)
					}
					console.log("directLimitLoaded", account, allocation.token, directLimit.toString(), directInvested.toString())
					directLimits.push({token: helpers.tokenSymbolForAddress(allocation.token), limit: directLimit.toString()})
				}
			}
		}


		console.log("TraderTrustRating", trustRating.toString())

		return {
			trustRating: trustRating.toString(),
			directLimits: directLimits
		}
	}
	return null
}

const mapAllocate = (event) => {
	return {
		...event,
		eventDate: moment.unix(event.eventDate).utc()
	}
}

const mapInvest = (event) => {
	return {
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
		state: "0"
	}
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
		state: "1"
	}
}

const mapRequestExit = (event) => {

	let state = "2"
	if (event.from === event.trader) {
		state = "3"
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
		state: "4"
	}
}

const mapRejectExit = (event) => {
	return {
		...event,
		rejectValue: new BigNumber(event.value),
		rejectExitDate: moment.unix(event.eventDate).utc(),
		state: "1"
	}
}


const getInvestmentValue = async (investment) => {
	console.log("getInvestmentValue", investment)
	let investorProfitPercent = investment.investorProfitPercent.dividedBy(10000)

	// get all positions for this investment
	let positions = await positionsDao.getByOwner(investment.trader)
	positions = positions.filter(
		(position) => helpers.tokenAddressForSymbol(position.dv_asset) === investment.token)

	positions = positions.filter(position =>
		position.dv_start.isAfter(investment.start) 
			&& (
				(investment.end.unix() === 0 || investment.state === "0") 
					|| position.dv_end.isBefore(investment.end)))

	console.log("P", positions)

	const allocations = await allocateDao.getByTraderAndToken(investment.trader, investment.token)

	console.log("A", allocations)

	const traderInvestments = await getTraderInvestments(investment.trader, investment.token)

	console.log("traderInvestments", traderInvestments)

	// for each position get all investments that it should be split over
	// and calculate profit/loss
	let grossProfit = new BigNumber(0)
	await positions.forEach(async (position) => {

		// find the allocation just before the start of this position
		let allocation = allocations.find(allocation => allocation.eventDate.isBefore(position.dv_start))

		// Fallback to the last allocation made, but there should be an allocation made before the position started
		// TODO: maybe remove?
		if (!allocation) {
			allocation = allocations[0]
		}

		console.log("allocation total", allocation.total.toString())

		console.log("position.profit", position.dv_profit.toString())
		let totalAmount = await getPositionInvestmentsAmount(position, traderInvestments)
		console.log("totalAmount", totalAmount.toString())

		let investorsShare = totalAmount.dividedBy(allocation.total)
		console.log("investorsShare", investorsShare.toString())

		// split profit according to share of total amount
		let sharePercentage = investment.amount.dividedBy(totalAmount)
		console.log("sharePercentage", sharePercentage.toString())

		let positionProfit = position.dv_profit.multipliedBy(sharePercentage).multipliedBy(investorsShare)
		console.log("positionProfit", positionProfit.toString())

		grossProfit = grossProfit.plus(positionProfit)
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
		let investList = await investDao.getByTraderAndToken(account, token)
		let stopList = await stopDao.getByTraderAndToken(account, token)

		investList.forEach((investment) => {
			let index = stopList.findIndex(stopped => stopped.id === investment.id)
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


const getPositionInvestmentsAmount = async (position, traderInvestments) => {
	let investments = traderInvestments.filter((investment) => helpers.tokenAddressForSymbol(position.dv_asset) === investment.token)
	
	investments = investments.filter(investment =>
		position.dv_start.isAfter(investment.start) 
			&& (
				(investment.end.unix() === 0 || investment.state === "0") 
					|| position.dv_end.isBefore(investment.end)))
	
	
	let totalAmount = investments.reduce((total, investment) => total.plus(investment.amount), new BigNumber(0))
	return totalAmount
}

