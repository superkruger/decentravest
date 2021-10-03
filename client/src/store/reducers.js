import { combineReducers } from 'redux'

function app (state = {}, action ) {
	switch (action.type) {

		case 'ETHEREUM_INSTALLED':
			return { ...state, ethereumInstalled: true }
		case 'JOINING':
			return { ...state, joining: action.busy }
		case 'NOTIFICATION_ADDED':
			{
				// prevent duplicates
				let index, data

				if (!state.notifications) {
					state.notifications = []
				}
				index = state.notifications.findIndex(notification => notification.id === action.notification.id)
				if (index === -1) {
					data = [...state.notifications, action.notification]
				} else {
					data = state.notifications
				}
				return { 
					...state, 
					notifications: [
						...data
					]
				} 
			}
		case 'NOTIFICATION_REMOVED':
			{
				// prevent duplicates
				let index, data

				index = state.notifications.findIndex(notification => notification.id === action.id)
				if (index !== -1) {
					state.notifications.splice(index, 1)
					data = state.notifications
				} else {
					data = state.notifications
				}
				return { 
					...state, 
					notifications: [
						...data
					]
				} 
			}
		case 'SIDEBAR_TOGGLED':
			return { ...state, sidebarClosed: !state.sidebarClosed }
		default:
			return state
	}
}

function web3 (state = {}, action ) {
	switch (action.type) {
		case 'WEB3_LOADED':
			return { ...state, connection: action.connection }
		case 'NETWORK_JOINED':
			return { ...state, network: action.name }
		case 'WEB3_ACCOUNT_LOADED':
			return { ...state, account: action.account }
		case 'TRADE_COUNT_LOADED':
			return { ...state, tradeCount: action.count } 
		case 'TRADERPAIRED_LOADED':
			return { ...state, traderPaired: {loaded: true, contract: action.contract} }
		case 'PAIREDINVESTMENTS_LOADED':
			return { ...state, pairedInvestments: {loaded: true, contract: action.contract} }
		case 'WALLETFACTORY_LOADED':
			return { ...state, walletFactory: {loaded: true, contract: action.contract} }
		case 'ADMIN_LOADED':
			return { ...state, isAdmin: true }
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
					state.balances[index] = {
						...state.balances[index],
						...action.balance
					}
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
				// if (index === -1) {
					data = [...state.traders, action.trader]
				// } else {
				// 	data = state.traders
				// }
				return { 
					...state, 
					traders: [
						...data
					]
				}
			}
		case 'SETTING_PROFIT':
			return { ...state, settingProfit: action.busy }
		case 'PROFIT_PERCENTAGES_LOADED':
			{
				let index, data

				index = state.traders.findIndex(trader => trader.user === action.profitPercentages.trader)
				if (index !== -1) {
					state.traders[index] = {
						...state.traders[index],
						investorCollateralProfitPercent: action.profitPercentages.investorCollateralProfitPercent,
						investorDirectProfitPercent: action.profitPercentages.investorDirectProfitPercent
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
		case 'TRADER_ALLOCATION_LOADED':
			{
				let index, data

				index = state.traders.findIndex(trader => trader.user === action.account)
				if (index !== -1) {

					let allocationData
					let trader = state.traders[index]
					if (!trader.allocations) {
						trader.allocations = []
					}
					let allocationIndex = trader.allocations.findIndex(allocation => allocation.token === action.allocation.token)
					if (allocationIndex === -1) {
						allocationData = [...trader.allocations, action.allocation]
					} else {
						trader.allocations[allocationIndex] = {
							...trader.allocations[allocationIndex],
							...action.allocation
						}
						allocationData = trader.allocations
					}

					state.traders[index] = {
						...state.traders[index],
						allocations: [
							...allocationData
						]
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
		case 'TRADER_STATISTICS_LOADED':
			{
				let index, data

				if (!state.traders) {
					state.traders = []
				}

				index = state.traders.findIndex(trader => trader.user === action.trader)

				if (index === -1) {
					state.traders.push({user: action.trader})
					index = state.traders.findIndex(trader => trader.user === action.trader)
				}

				if (index !== -1) {
					state.traders[index] = {
						...state.traders[index],
						statistics: action.statistics
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
		case 'INVESTOR_STATISTICS_LOADED':
			{
				let index, data

				if (!state.investors) {
					state.investors = [{user: action.investor}]
				}

				index = state.investors.findIndex(investor => investor.user === action.investor)
				if (index !== -1) {
					state.investors[index] = {
						...state.investors[index],
						statistics: action.statistics
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
		case 'PUBLIC_STATISTICS_LOADED':
			{
				return { ...state, publicstatistics: action.statistics }
			}
		case 'DIRECT_LIMIT_LOADED':
			{
				let index, data

				index = state.traders.findIndex(trader => trader.user === action.trader)
				if (index !== -1) {

					let allocationData
					let trader = state.traders[index]
					let allocationIndex = trader.allocations.findIndex(allocation => allocation.token === action.token)
					if (allocationIndex === -1) {
						allocationData = [...trader.allocations, action.allocation]
					} else {
						let allocation = trader.allocations[allocationIndex]
						allocation.directLimit = action.limit
						allocation.directInvested = action.invested

						trader.allocations[allocationIndex] = {
							...allocation
						}
						allocationData = trader.allocations
					}

					state.traders[index] = {
						...state.traders[index],
						allocations: [
							...allocationData
						]
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
		case 'INVESTING':
			{
				let index, data
				let id = `${action.trader}_${action.tokenAddress}_${action.investmentType}`
				
				if (action.busy) {
					if (!state.investings) {
						state.investings = []
					}

					index = state.investings.findIndex(start => start.id === id)
					let startObj = {id: id, message: action.message}

					if (index === -1) {
						data = [...state.investings, startObj]
					} else {
						state.investings[index] = {
							...state.investings[index],
							...startObj
						}
						data = state.investings
					}
				} else {
					index = state.investings.findIndex(start => start.id === id)

					if (index !== -1) {
						state.investings.splice(index, 1)
						data = state.investings
					} else {
						data = state.investings
					}
				}
				
				return { 
					...state, 
					investings: [
						...data
					]
				}
			}
		case 'ALLOCATING':
			{
				let index, data
				let id = `${action.tokenAddress}`

				if (action.busy) {
					if (!state.allocatings) {
						state.allocatings = []
					}

					index = state.allocatings.findIndex(start => start.id === id)
					let startObj = {id: id}

					if (index === -1) {
						data = [...state.allocatings, startObj]
					} else {
						state.allocatings[index] = {
							...state.allocatings[index],
							...startObj
						}
						data = state.allocatings
					}
				} else {
					index = state.allocatings.findIndex(start => start.id === id)

					if (index !== -1) {
						state.allocatings.splice(index, 1)
						data = state.allocatings
					} else {
						data = state.allocatings
					}
				}
				
				return { 
					...state, 
					allocatings: [
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
		
		case 'MAIN_TRADER_LOADED':
			return { ...state, joining: false, trader: action.trader }
		case 'TRADE_LOADED':
			{
				// prevent duplicates
				let index, data

				if (state.trades === undefined) {
					state.trades = {data: []}
				}
				index = state.trades.data.findIndex(trade => trade.id === action.trade.id)
				if (index === -1) {
					data = [...state.trades.data, action.trade]
				} else {
					data = state.trades.data
				}
				return { 
					...state, 
					trades: {
						...state.trades,
						data
					}}
			}
		
		default:
			return state
	}
}

function investor (state = {}, action ) {
	switch (action.type) {
		case 'MAIN_INVESTOR_LOADED':
			return { ...state, joining: false, investor: action.investor }
		case 'WALLET_CREATING':
			return { ...state, wallet: {creating: true} }
		case 'MAIN_WALLET_LOADED':
			return { ...state, wallet: {creating: false, balances: [], contract: action.contract} }
		case 'MAIN_WALLET_BALANCE_LOADED':
			{
				let index, data

				if (!state.wallet.balances) {
					state.wallet.balances = []
				}
				index = state.wallet.balances.findIndex(balance => balance.symbol === action.balance.symbol)
				if (index === -1) {
					data = [...state.wallet.balances, action.balance]
				} else {
					state.wallet.balances[index] = {
						...state.wallet.balances[index],
						...action.balance
					}
					data = state.wallet.balances
				}
				return { 
					...state,
					wallet: {
						...state.wallet,
						balances: [
							...data
						]
					}
				} 
			}
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