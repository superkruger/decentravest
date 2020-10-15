import { find, get, groupBy } from 'lodash'
import BigNumber from 'bignumber.js'
import moment from 'moment'
import { createSelector } from 'reselect'
import { NEUTRAL, RED, GREEN, formatBalance, tokenSymbolForAddress, log } from '../helpers'

const notifications = (state) => get(state, 'app.notifications', [])
export const notificationsSelector = createSelector(notifications, a => a)

const sidebarClosed = (state) => get(state, 'app.sidebarClosed', false)
export const sidebarClosedSelector = createSelector(sidebarClosed, a => a)

const account = (state) => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

const network = state => get(state, 'web3.network', 'DEV')
export const networkSelector = createSelector(network, w => w)

const traderPairedLoaded = state => get(state, 'web3.traderPaired.loaded', false)
export const traderPairedLoadedSelector = createSelector(traderPairedLoaded, el => el)

const traderPaired = state => get(state, 'web3.traderPaired.contract')
export const traderPairedSelector = createSelector(traderPaired, e => e)

const pairedInvestments = state => get(state, 'web3.pairedInvestments.contract')
export const pairedInvestmentsSelector = createSelector(pairedInvestments, e => e)

const walletFactory = state => get(state, 'web3.walletFactory.contract')
export const walletFactorySelector = createSelector(walletFactory, e => e)

const isAdmin = state => get(state, 'web3.isAdmin', false)
export const isAdminSelector = createSelector(isAdmin, t => t)

const tokens = state => get(state, 'web3.tokens', [])
export const tokensSelector = createSelector(tokens, t => t)

const wallet = state => get(state, 'investor.wallet', null)
export const walletSelector = createSelector(wallet, (wallet) => {
	if (wallet && wallet.balances) {
		wallet.balances = decorateBalances(wallet.balances)
	}
	return wallet
})

const walletCreating = state => get(state, 'investor.wallet.creating', false)
export const walletCreatingSelector = createSelector(walletCreating, e => e)

const balances = state => get(state, 'web3.balances', [])
export const balancesSelector = createSelector(balances, (balances) => {
	if (balances.length > 0) {
		balances = decorateBalances(balances)
	}
	return balances
})

const decorateBalances = (balances) => {
	return balances.map((balance) => {
		balance = decorateBalance(balance)
		return balance
	})
}

const decorateBalance = (balance) => {
	return ({
		...balance,
		formatted: formatBalance(balance.amount, balance.symbol)
	})
}

const traders = state => get(state, 'web3.traders', [])
export const tradersSelector = createSelector(traders, e => e)

export const investableTradersSelector = createSelector(traders, (traders) => {
	const res = traders.filter((trader) => {
		log('traders.filter', trader.allocations)
		return (trader.allocations && trader.allocations.length !== 0 && trader.allocations.some(allocation => !allocation.total.isZero()))
	})

	log('investableTradersSelector', res)
	return res
})

const mainTrader = state => get(state, 'trader.trader')
export const mainTraderSelector = createSelector(mainTrader, e => e)

const trader = (state, account) => {
	const traderObj = find(state.web3.traders, {user: account})
	return traderObj
}
export const traderSelector = createSelector(trader, e => e)

const traderJoining = state => get(state, 'trader.joining', false)
export const traderJoiningSelector = createSelector(traderJoining, e => e)

const investor = state => get(state, 'investor.investor')
export const investorSelector = createSelector(investor, e => e)

const investorJoining = state => get(state, 'investor.joining', false)
export const investorJoiningSelector = createSelector(investorJoining, e => e)

const tradeCount = state => get(state, 'web3.tradeCount', 0)
export const tradeCountSelector = createSelector(tradeCount, e => e)

const traderStatistics = (state, trader) => {
	const traderObj = find(state.web3.traders, {user: trader})
	if (traderObj && traderObj.statistics) {
		return traderObj.statistics
	}
	return null
}
export const traderStatisticsSelector = createSelector(traderStatistics, (traderStatistics) => {
	if (!traderStatistics) {
		return null
	}
	traderStatistics.tradingRatings.formattedAverageProfits = {}
	traderStatistics.profitRatings.formattedAverageProfits = {}
	traderStatistics.limits.formattedDirectAvailable = {}

	for (let key in traderStatistics.tradingRatings.averageProfits) {
		const average = new BigNumber(traderStatistics.tradingRatings.averageProfits[key])
		traderStatistics.tradingRatings.formattedAverageProfits[key] = formatBalance(average, key)
		traderStatistics.tradingRatings.averageProfits[key] = average
	}

	for (let key in traderStatistics.profitRatings.averageProfits) {
		const average = new BigNumber(traderStatistics.profitRatings.averageProfits[key])
		traderStatistics.profitRatings.formattedAverageProfits[key] = formatBalance(average, key)
		traderStatistics.profitRatings.averageProfits[key] = average
	}

	for (let key in traderStatistics.limits.directLimits) {
		const limit = new BigNumber(traderStatistics.limits.directLimits[key])
		traderStatistics.limits.directLimits[key] = limit
	}

	for (let key in traderStatistics.limits.directInvested) {
		const invested = new BigNumber(traderStatistics.limits.directInvested[key])
		traderStatistics.limits.directInvested[key] = invested

		traderStatistics.limits.formattedDirectAvailable[key] = 
			formatBalance(traderStatistics.limits.directLimits[key].minus(traderStatistics.limits.directInvested[key]), key)
	}

	return {
		...traderStatistics
	}
})

const traderAllocations = (state, trader) => {
	const traderObj = find(state.web3.traders, {user: trader})
	log("traderAllocations", traderObj)
	if (traderObj && traderObj.allocations) {
		return traderObj.allocations
	}
	return []
}
export const traderAllocationsSelector = createSelector(traderAllocations, (allocations) => {
	if (allocations) {
		allocations = decorateTraderAllocations(allocations)
	}
	return allocations
})

const decorateTraderAllocations = (allocations) => {
	return allocations.map((allocation) => {
		allocation = decorateTraderAllocation(allocation)
		return allocation
	})
}

const decorateTraderAllocation = (allocation) => {

	let investedPercentage = 0
	if (allocation.total.isGreaterThan(0)) {
		investedPercentage = allocation.invested.dividedBy(allocation.total).multipliedBy(100).toNumber()
	}
	const directAvailable = allocation.directLimit ? allocation.directLimit.minus(allocation.directInvested) : BigNumber(0)

	return ({
		...allocation,
		formattedTotal: formatBalance(allocation.total, allocation.symbol),
		formattedInvested: formatBalance(allocation.invested, allocation.symbol),
		available: allocation.total.minus(allocation.invested),
		formattedAvailable: formatBalance(allocation.total.minus(allocation.invested), allocation.symbol),
		directAvailable: directAvailable,
		formattedDirectLimit: allocation.directLimit ? formatBalance(allocation.directLimit, allocation.symbol) : '',
		formattedDirectAvailable: allocation.directLimit ? formatBalance(directAvailable, allocation.symbol) : ''
	})
}

const tradesLoaded = state => get(state, 'trader.trades.loaded', false)
export const tradesLoadedSelector = createSelector(tradesLoaded, e => e)

const trades = state => get(state, 'trader.trades.data', [])
export const tradesSelector = createSelector(trades, (trades) => {
	if (trades !== undefined) {

		trades = trades.map(decorateTrade)
		trades = trades.sort((a, b) => b.start.diff(a.start))

		// group by asset
		trades = groupBy(trades, (p) => p.asset)
	}
	return trades
})

const decorateTrade = (trade) => {

	return ({
		...trade,
		formattedStart: trade.start.local().format('HH:mm:ss D-M-Y'),
		formattedEnd: trade.end.local().format('HH:mm:ss D-M-Y'),
		formattedProfit: formatBalance(trade.profit, trade.asset),
		profitClass: trade.profit.lt(0) ? RED : trade.profit.gt(0) ? GREEN : NEUTRAL
	})
}

const tradesForInvestment = (state, investment) => {
	let tokenSymbol = tokenSymbolForAddress(investment.token)

	if (state.trader && state.trader.trades) {
		let trades = state.trader.trades.data.filter(trade => 
			trade.trader === investment.trader &&
			trade.asset === tokenSymbol)

		trades = trades.map(decorateTrade)
		trades = trades.sort((a, b) => b.start.diff(a.start))

		trades = trades.filter(trade =>
			trade.start.isAfter(investment.start) 
				&& (
					(investment.end.unix() === 0 || investment.state === "0") 
						|| trade.end.isBefore(investment.end)))

		return trades
	}
	return []
}
export const tradesForInvestmentSelector = createSelector(tradesForInvestment, e => e)

const investments = state => get(state, 'web3.investments', [])
export const investmentsSelector = createSelector(investments, (investments) => {
	if (investments !== undefined) {
		investments = investments.sort((a, b) => b.start.diff(a.start))
		investments = decorateInvestments(investments)
	}
	return investments
})

const decorateInvestments = (investments) => {
	return investments.map((investment) => {
		investment = decorateInvestment(investment)
		return investment
	})
}

const decorateInvestment = (investment) => {
	log("decorateInvestment", investment)
	return ({
		...investment,
		formattedStart: investment.start.local().format('HH:mm:ss D-M-Y'),
		formattedEnd: investment.end.unix() ? investment.end.local().format('HH:mm:ss D-M-Y') : "",
		formattedAmount: formatBalance(investment.amount, tokenSymbolForAddress(investment.token)),
		formattedValue: formatBalance(investment.value, tokenSymbolForAddress(investment.token)),
		formattedGrossValue: formatBalance(investment.grossValue, tokenSymbolForAddress(investment.token)),
		formattedNettValue: formatBalance(investment.nettValue, tokenSymbolForAddress(investment.token)),
		formattedInvestorProfit: formatBalance(investment.nettValue.minus(investment.amount), tokenSymbolForAddress(investment.token)),
		profitClass: investment.grossValue.gt(investment.amount) ? GREEN : investment.grossValue.lt(investment.amount) ? RED : NEUTRAL
	})
}

const investorInvestmentCountForTraderSelector = createSelector(investments, (investments) => {
	if (investments !== undefined) {
		investments = decorateInvestments(investments)
	}
	return investments
})

const investmentActionRequired = (state) => {
	if (!state.web3.investments) {
		return false
	}
	return state.web3.investments.some((investment) => {

		if (investment.state === "2" && investment.investor !== state.web3.account) {
			return true
		}

		if (investment.state === "3" && investment.trader !== state.web3.account) {
			return true
		}
		
		return false
	})
}
export const investmentActionRequiredSelector = createSelector(investmentActionRequired, e => e)


