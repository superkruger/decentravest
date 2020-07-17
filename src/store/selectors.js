import { find, get, groupBy } from 'lodash'
import { createSelector } from 'reselect'
import { NEUTRAL, RED, GREEN, formatBalance, getTokenSymbol } from '../helpers'

const page = (state) => get(state, 'app.page', 'home')
export const pageSelector = createSelector(page, a => a)

const account = (state) => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

const traderPairedLoaded = state => get(state, 'traderPaired.loaded', false)
export const traderPairedLoadedSelector = createSelector(traderPairedLoaded, el => el)

const traderPaired = state => get(state, 'traderPaired.contract')
export const traderPairedSelector = createSelector(traderPaired, e => e)

const pairedInvestments = state => get(state, 'pairedInvestments.contract')
export const pairedInvestmentsSelector = createSelector(pairedInvestments, e => e)

const walletFactory = state => get(state, 'traderPaired.walletFactory')
export const walletFactorySelector = createSelector(walletFactory, e => e)

const wallet = state => get(state, 'wallet.contract')
export const walletSelector = createSelector(wallet, e => e)

const walletLoading = state => get(state, 'wallet.loading', true)
export const walletLoadingSelector = createSelector(walletLoading, e => e)

const walletCreating = state => get(state, 'wallet.creating', false)
export const walletCreatingSelector = createSelector(walletCreating, e => e)

const tokens = state => get(state, 'traderPaired.tokens', [])
export const tokensSelector = createSelector(tokens, t => t)

const balances = state => get(state, 'traderPaired.balances', [])
export const balancesSelector = createSelector(balances, (balances) => {
	if (balances !== undefined) {

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

const traders = state => get(state, 'traderPaired.traders', [])
export const tradersSelector = createSelector(traders, e => e)

const trader = state => get(state, 'traderPaired.trader')
export const traderSelector = createSelector(trader, e => e)

const traderJoining = state => get(state, 'traderPaired.traderJoining', false)
export const traderJoiningSelector = createSelector(traderJoining, e => e)

const investor = state => get(state, 'traderPaired.investor')
export const investorSelector = createSelector(investor, e => e)

const investorJoining = state => get(state, 'traderPaired.investorJoining', false)
export const investorJoiningSelector = createSelector(investorJoining, e => e)

const positionsCount = state => get(state, 'traderPaired.positionsCount', 0)
export const positionsCountSelector = createSelector(positionsCount, e => e)

const traderRatings = (state, trader) => {
	const traderObj = find(state.traderPaired.traders, {user: trader})
	if (traderObj && traderObj.ratings) {
		return traderObj.ratings
	}
	return []
}
export const traderRatingsSelector = createSelector(traderRatings, e => e)

const traderAllocations = (state, trader) => {
	const traderObj = find(state.traderPaired.traders, {user: trader})
	if (traderObj && traderObj.allocations) {
		return traderObj.allocations
	}
	return []
}
export const traderAllocationsSelector = createSelector(traderAllocations, (allocations) => {
	console.log("Allocations", allocations)
	if (allocations) {

		allocations = decorateTraderAllocations(allocations)

		// group by name
		allocations = groupBy(allocations, (a) => a.name)
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
		investedPercentage: investedPercentage,
		formattedTotal: formatBalance(allocation.total, allocation.name),
		formattedInvested: formatBalance(allocation.invested, allocation.name),
		investedPercentageTarget: 100
	})
}

const traderPositionsLoaded = state => get(state, 'traderPaired.traderpositions.loaded', false)
export const traderPositionsLoadedSelector = createSelector(traderPositionsLoaded, e => e)

const traderPositions = state => get(state, 'traderPaired.traderpositions.data', [])
export const traderPositionsSelector = createSelector(traderPositions, (positions) => {
	// console.log('Positions', positions)
	if (positions !== undefined) {

		positions = positions.sort((a, b) => b.createdAt - a.createdAt)
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
		formattedCreatedAt: position.createdAt.format('hh:mm:ss D-M-Y'),
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

const investorInvestments = state => get(state, 'pairedInvestments.investorInvestments', [])
export const investorInvestmentsSelector = createSelector(investorInvestments, (investments) => {
	if (investments !== undefined) {
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
	return ({
		...investment,
		formattedAmount: formatBalance(investment.amount, getTokenSymbol(investment.token)),
		formattedValue: formatBalance(investment.value, getTokenSymbol(investment.token)),
		profitClass: investment.value.gt(investment.amount) ? GREEN : investment.value.lt(investment.amount) ? RED : NEUTRAL
	})
}


// // Projects
// const projectsLoaded = state => get(state, 'crowdsale.projects.loaded', false)
// export const projectsLoadedSelector = createSelector(projectsLoaded, l => l)

// const projects = state => get(state, 'crowdsale.projects.data', [])
// export const projectsSelector = createSelector(
// 	projects,
// 	(projects) => {
// 		projects = decorateProjects(projects)

// 		// sort descending for display
// 		projects = projects.sort((a, b) => b.deadline - a.deadline)
// 		return projects
// 	}
// )

// const decorateProjects = (projects) => {
// 	return projects.map((project) => {
// 		project = decorateProject(project)
// 		return project
// 	})
// }

// const decorateProject = (project) => {
// 	return ({
// 		...project,
// 		formattedTimestamp: moment.unix(project.deadline).format('hh:mm:ss D/M/Y')
// 	})
// }