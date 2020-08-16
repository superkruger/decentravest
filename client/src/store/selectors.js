import { find, get, groupBy } from 'lodash'
import { createSelector } from 'reselect'
import { NEUTRAL, RED, GREEN, formatBalance, tokenSymbolForAddress, log } from '../helpers'

const notifications = (state) => get(state, 'app.notifications', [])
export const notificationsSelector = createSelector(notifications, a => a)

const page = (state) => get(state, 'app.page', 'home')
export const pageSelector = createSelector(page, a => a)

const sidebarClosed = (state) => get(state, 'app.sidebarClosed', false)
export const sidebarClosedSelector = createSelector(sidebarClosed, a => a)

const account = (state) => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

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

const trader = state => get(state, 'trader.trader')
export const traderSelector = createSelector(trader, e => e)

const traderJoining = state => get(state, 'trader.joining', false)
export const traderJoiningSelector = createSelector(traderJoining, e => e)

const investor = state => get(state, 'investor.investor')
export const investorSelector = createSelector(investor, e => e)

const investorJoining = state => get(state, 'investor.joining', false)
export const investorJoiningSelector = createSelector(investorJoining, e => e)

const positionsCount = state => get(state, 'web3.positionsCount', 0)
export const positionsCountSelector = createSelector(positionsCount, e => e)

const traderRatings = (state, trader) => {
	const traderObj = find(state.web3.traders, {user: trader})
	if (traderObj && traderObj.ratings) {
		return traderObj.ratings
	}
	return []
}
export const traderRatingsSelector = createSelector(traderRatings, e => e)

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

	return ({
		...allocation,
		formattedTotal: formatBalance(allocation.total, allocation.symbol),
		formattedInvested: formatBalance(allocation.invested, allocation.symbol),
		available: allocation.total.minus(allocation.invested),
		formattedAvailable: formatBalance(allocation.total.minus(allocation.invested), allocation.symbol)
	})
}

const traderPositionsLoaded = state => get(state, 'trader.positions.loaded', false)
export const traderPositionsLoadedSelector = createSelector(traderPositionsLoaded, e => e)

const traderPositions = state => get(state, 'trader.positions.data', [])
export const traderPositionsSelector = createSelector(traderPositions, (positions) => {
	// log('Positions', positions)
	if (positions !== undefined) {

		positions = positions.sort((a, b) => b.start.diff(a.start))
		positions = decorateTraderPositions(positions)

		// group by asset
		positions = groupBy(positions, (p) => p.asset)
	}
	return positions
})

const decorateTraderPositions = (positions) => {
	return positions.map((position) => {
		position = decorateTraderPosition(position)
		return position
	})
}

const decorateTraderPosition = (position) => {

	return ({
		...position,
		formattedStart: position.start.local().format('HH:mm:ss D-M-Y'),
		profit: decoratePositionProfit(position)
	})
}

const decoratePositionProfit = (position) => {
	return ({
		formattedFeeAmount: formatBalance(position.fee, position.asset),
		formattedProfit: formatBalance(position.profit, position.asset),
		profitClass: position.profit.lt(0) ? RED : position.profit.gt(0) ? GREEN : NEUTRAL,
		formattedNettProfit: formatBalance(position.nettProfit, position.asset),
		nettProfitClass: position.nettProfit.lt(0) ? RED : position.nettProfit.gt(0) ? GREEN : NEUTRAL
	})
}

const positionsForInvestment = (state, investment) => {
	let tokenSymbol = tokenSymbolForAddress(investment.token)
	if (tokenSymbol === 'ETH') {
		tokenSymbol = 'WETH'
	}
	if (state.trader && state.trader.positions) {
		let positions = state.trader.positions.data.filter(position => 
			position.owner === investment.trader &&
			position.asset === tokenSymbol)

		positions = positions.sort((a, b) => b.start.diff(a.start))
		positions = decorateTraderPositions(positions)

		// if(process.env.NODE_ENV !== 'development') {
			// filter by date
			positions = positions.filter(position =>
				position.start.isAfter(investment.start) 
					&& (
						(investment.end.unix() === 0 || investment.state === "0") 
							|| position.end.isBefore(investment.end)))
		// }

		return positions
	}
	return []
}
export const positionsForInvestmentSelector = createSelector(positionsForInvestment, e => e)

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


