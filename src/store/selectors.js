import { get } from 'lodash'
import { createSelector } from 'reselect'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import { GREEN, RED, NEUTRAL, formatEtherBalance, weiToEther } from '../helpers'

const account = (state) => get(state, 'web3.account')
export const accountSelector = createSelector(account, a => a)

const web3 = state => get(state, 'web3.connection')
export const web3Selector = createSelector(web3, w => w)

const crowdvestLoaded = state => get(state, 'crowdvest.loaded', false)
export const crowdvestLoadedSelector = createSelector(crowdvestLoaded, el => el)

const crowdvest = state => get(state, 'crowdvest.contract')
export const crowdvestSelector = createSelector(crowdvest, e => e)

const trader = state => get(state, 'crowdvest.trader')
export const traderSelector = createSelector(trader, e => e)

const investor = state => get(state, 'crowdvest.investor')
export const investorSelector = createSelector(investor, e => e)

const traderPositionsLoaded = state => get(state, 'crowdvest.traderpositions.loaded', false)
export const traderPositionsLoadedSelector = createSelector(traderPositionsLoaded, e => e)

const traderPositions = state => get(state, 'crowdvest.traderpositions.data')
export const traderPositionsSelector = createSelector(traderPositions, (positions) => {
	console.log('Positions', positions)
	if (positions !== undefined) {
		positions = positions.sort((a, b) => b.createdAt - a.createdAt)
		positions = decorateTraderPositions(positions)
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
	let amount
	let profitClass = NEUTRAL
	let formattedAmount = 0

	if (position.status === 'CLOSED') {
		let firstAction = position.standardActions.find(a => a.type === 'ISOLATED_OPEN')
		let lastAction = position.standardActions.find(a => a.type === 'ISOLATED_FULL_CLOSE')
		if (firstAction !== undefined && lastAction !== undefined) {
			console.log('firstAction', firstAction)
			console.log('lastAction', lastAction)
			amount = lastAction.transferAmount.minus(firstAction.transferAmount)
			console.log('amount', amount.toString())
			formattedAmount = formatEtherBalance(amount)
		}
	}

	console.log('formattedAmount', formattedAmount)

	return ({
		amount: amount,
		formattedAmount: formattedAmount,
		profitClass: profitClass
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