import { combineReducers } from 'redux'

function app (state = {}, action ) {
	switch (action.type) {
		case 'PAGE_SELECTED':
			return { ...state, page: action.page }
		default:
			return state
	}
}

function web3 (state = {}, action ) {
	switch (action.type) {
		case 'WEB3_LOADED':
			return { ...state, connection: action.connection }
		case 'WEB3_ACCOUNT_LOADED':
			return { ...state, account: action.account }
		default:
			return state
	}
}

function traderPaired (state = {}, action ) {
	switch (action.type) {
		case 'TRADERPAIRED_LOADED':
			return { ...state, loaded: true, contract: action.contract }
		case 'TRADER_JOINING':
			return { ...state, traderJoining: true }
		case 'ALL_TRADERS_LOADED':
			return { ...state, allTraders: action.traders }
		case 'TRADER_LOADED':
			return { ...state, traderJoining: false, trader: action.trader }
		case 'INVESTOR_LOADED':
			return { ...state, investor: action.investor }
		case 'POSITIONS_COUNT_LOADED':
			return { ...state, positionsCount: action.count } 
		case 'TRADER_RATINGS_LOADED':
			return { ...state, traderratings: action.ratings }
		case 'TRADER_POSITIONS_LOADED':
			return { ...state, traderpositions: {...state.traderpositions, loaded: true} } 
		case 'TRADER_POSITION_LOADED':
			// prevent duplicates
			let index, data

			if (state.traderpositions === undefined) {
				state.traderpositions = {loaded: false, data: []}
			}
			index = state.traderpositions.data.findIndex(position => position.uuid === action.position.uuid)
			if (index === -1) {
				data = [...state.traderpositions.data, action.position]
			} else {
				data = state.traderpositions.data
			}
			return { 
				...state, 
				traderpositions: {
					...state.traderpositions,
					loaded: false,
					data
				}} 
		default:
			return state
	}
}

// function project (state = {}, action ) {
// 	switch (action.type) {
// 		case 'FUNDING_RECEIVED':
// 			return { ...state, funding: action.funding }
// 		case 'CREATOR_PAID':
// 			return { ...state, creator: action.creator }
// 		default:
// 			return state
// 	}
// }

const rootReducer = combineReducers({
	app,
	web3,
	traderPaired
})

export default rootReducer