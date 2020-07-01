import { get, groupBy } from 'lodash'
import { createSelector } from 'reselect'
import { NEUTRAL, RED, GREEN, formatBalance } from '../helpers'

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

const allTraders = state => get(state, 'traderPaired.allTraders', [])
export const allTradersSelector = createSelector(allTraders, e => e)

const trader = state => get(state, 'traderPaired.trader')
export const traderSelector = createSelector(trader, e => e)

const traderJoining = state => get(state, 'traderPaired.traderJoining', false)
export const traderJoiningSelector = createSelector(traderJoining, e => e)

const investor = state => get(state, 'traderPaired.investor')
export const investorSelector = createSelector(investor, e => e)

const positionsCount = state => get(state, 'traderPaired.positionsCount', 0)
export const positionsCountSelector = createSelector(positionsCount, e => e)

const traderRatings = state => get(state, 'traderPaired.traderratings', [])
export const traderRatingsSelector = createSelector(traderRatings, e => e)

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