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
		case 'WALLETFACTORY_LOADED':
			return { ...state, walletFactory: action.contract }
		case 'TOKENS_LOADED':
			return { ...state, tokens: action.tokens }
		case 'BALANCE_LOADED':
			{
				// prevent duplicates
				let index, data

				if (state.balances === undefined) {
					state.balances = []
				}
				index = state.balances.findIndex(balance => balance.symbol === action.balance.symbol)
				if (index === -1) {
					data = [...state.balances, action.balance]
				} else {
					data = state.balances
				}
				return { 
					...state, 
					balances: data
				} 
			}
		case 'TRADER_JOINING':
			return { ...state, traderJoining: true }
		case 'INVESTOR_JOINING':
			return { ...state, investorJoining: true }
		case 'TRADERS_LOADED':
			return { ...state, traders: action.traders }
		case 'TRADER_LOADED':
			return { ...state, traderJoining: false, trader: action.trader }
		case 'TRADER_ALLOCATIONS_LOADED':
			{
				let index, data

				index = state.traders.findIndex(trader => trader.user === action.trader)
				if (index !== -1) {
					state.traders[index] = {
						...state.traders[index],
						allocations: action.allocations
					}
				}
				data = state.traders
				return { 
					...state, 
					traders: data
				}
			}
		case 'INVESTOR_LOADED':
			return { ...state, investorJoining: false, investor: action.investor }
		case 'POSITIONS_COUNT_LOADED':
			return { ...state, positionsCount: action.count } 
		case 'TRADER_RATINGS_LOADED':
			{
				let index, data

				index = state.traders.findIndex(trader => trader.user === action.trader)
				if (index !== -1) {
					state.traders[index] = {
						...state.traders[index],
						ratings: action.ratings
					}
				}
				data = state.traders
				return { 
					...state, 
					traders: data
				}
			}
		case 'TRADER_POSITIONS_LOADED':
			return { ...state, traderpositions: {...state.traderpositions, loaded: true} } 
		case 'TRADER_POSITION_LOADED':
			{
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
			}
		default:
			return state
	}
}

function pairedInvestments (state = {}, action ) {
	switch (action.type) {
		case 'PAIREDINVESTMENTS_LOADED':
			return { ...state, loading: false, contract: action.contract }
		case 'INVESTOR_INVESTMENTS_LOADED':
			return { ...state, investorInvestments: action.investments }
		default:
			return state
	}
}

function wallet (state = {}, action ) {
	switch (action.type) {
		case 'WALLET_CREATING':
			return { ...state, creating: action.creating }
		case 'WALLET_LOADED':
			return { ...state, creating: false, loading: false, contract: action.contract }
		default:
			return state
	}
}

const rootReducer = combineReducers({
	app,
	web3,
	traderPaired,
	pairedInvestments,
	wallet
})

export default rootReducer