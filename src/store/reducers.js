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
		case 'POSITIONS_COUNT_LOADED':
			return { ...state, positionsCount: action.count } 
		case 'TRADERPAIRED_LOADED':
			return { ...state, traderPaired: {loaded: true, contract: action.contract} }
		case 'PAIREDINVESTMENTS_LOADED':
			return { ...state, pairedInvestments: {loaded: true, contract: action.contract} }
		case 'WALLETFACTORY_LOADED':
			return { ...state, walletFactory: {loaded: true, contract: action.contract} }
		case 'TOKENS_LOADED':
			return { ...state, tokens: action.tokens }
		case 'BALANCE_LOADED':
			{
				// prevent duplicates
				let index, data

				if (!state.balances) {
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
					balances: [
						...data
					]
				} 
			}
		case 'TRADER_LOADED':
			{
				// prevent duplicates
				let index, data

				if (!state.traders) {
					state.traders = []
				}
				index = state.traders.findIndex(trader => trader.user === action.trader.user)
				if (index === -1) {
					data = [...state.traders, action.trader]
				} else {
					data = state.traders
				}
				return { 
					...state, 
					traders: [
						...data
					]
				}
			}
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
					traders: [
						...data
					]
				}
			}
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
					traders: [
						...data
					]
				}
			}
		case 'INVESTOR_LOADED':
			{
				// prevent duplicates
				let index, data

				if (!state.investors) {
					state.investors = []
				}
				index = state.investors.findIndex(investor => investor.user === action.investor.user)
				if (index === -1) {
					data = [...state.investors, action.investor]
				} else {
					data = state.investors
				}
				return { 
					...state, 
					investors: [
						...data
					]
				}
			}
		case 'WALLET_LOADED':
			{
				let index, data

				index = state.investors.findIndex(investors => investors.user === action.investor)
				if (index !== -1) {
					state.investors[index] = {
						...state.investors[index],
						wallet: action.contract
					}
				}
				data = state.investors
				return { 
					...state, 
					investors: [
						...data
					]
				}
			}
		case 'INVESTMENT_LOADED':
			{
				// prevent duplicates
				let index, data

				if (!state.investments) {
					state.investments = []
				}
				index = state.investments.findIndex(investment => investment.id === action.investment.id)
				if (index === -1) {
					data = [...state.investments, action.investment]
				} else {
					state.investments[index] = {
						...state.investments[index],
						...action.investment
					}
					data = state.investments
				}
				return { 
					...state, 
					investments: [
						...data
					]
				}
			}
		case 'DISBURSEMENT_CREATED':
			{
				let index, data

				index = state.investments.findIndex(investment => investment.id === action.disbursement.investmentId)
				if (index !== -1) {
					state.investments[index] = {
						...state.investments[index],
						disbursementId: action.disbursement.disbursementId
					}
				}
				data = state.investments
				return { 
					...state, 
					investments: [
						...data
					]
				}
			}
		
		default:
			return state
	}
}

function trader (state = {}, action ) {
	switch (action.type) {
		
		case 'TRADER_JOINING':
			return { ...state, joining: true }
		case 'MAIN_TRADER_LOADED':
			return { ...state, joining: false, trader: action.trader }
		case 'TRADER_POSITIONS_LOADED':
			return { ...state, positions: {...state.positions, loaded: true} } 
		case 'TRADER_POSITION_LOADED':
			{
				// prevent duplicates
				let index, data

				if (state.positions === undefined) {
					state.positions = {loaded: false, data: []}
				}
				index = state.positions.data.findIndex(position => position.uuid === action.position.uuid)
				if (index === -1) {
					data = [...state.positions.data, action.position]
				} else {
					data = state.positions.data
				}
				return { 
					...state, 
					positions: {
						...state.positions,
						loaded: false,
						data
					}}
			}
		
		default:
			return state
	}
}

function investor (state = {}, action ) {
	switch (action.type) {
		case 'INVESTOR_JOINING':
			return { ...state, joining: true }
		case 'MAIN_INVESTOR_LOADED':
			return { ...state, joining: false, investor: action.investor }
		case 'WALLET_CREATING':
			return { ...state, wallet: {creating: true} }
		case 'MAIN_WALLET_LOADED':
			return { ...state, wallet: {creating: false, contract: action.contract} }
		default:
			return state
	}
}


const rootReducer = combineReducers({
	app,
	web3,
	trader,
	investor
})

export default rootReducer