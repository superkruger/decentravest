
export function notificationAdded(notification) {
	return {
		type: 'NOTIFICATION_ADDED',
		notification
	}
}

export function notificationRemoved(id) {
	return {
		type: 'NOTIFICATION_REMOVED',
		id
	}
}

export function sidebarToggled() {
	return {
		type: 'SIDEBAR_TOGGLED'
	}
}

export function web3Loaded(connection) {
	return {
		type: 'WEB3_LOADED',
		connection
	}
}

export function networkJoined(name) {
	return {
		type: 'NETWORK_JOINED',
		name
	}
}

export function web3AccountLoaded(account) {
	return {
		type: 'WEB3_ACCOUNT_LOADED',
		account
	}
}

export function traderPairedLoaded(contract) {
	return {
		type: 'TRADERPAIRED_LOADED',
		contract
	}
}

export function pairedInvestmentsLoaded(contract) {
	return {
		type: 'PAIREDINVESTMENTS_LOADED',
		contract
	}
}

export function walletFactoryLoaded(contract) {
	return {
		type: 'WALLETFACTORY_LOADED',
		contract
	}
}

export function adminLoaded() {
	return {
		type: 'ADMIN_LOADED'
	}
}

export function walletCreating(creating) {
	return {
		type: 'WALLET_CREATING',
		creating
	}
}

export function mainWalletLoaded(contract) {
	return {
		type: 'MAIN_WALLET_LOADED',
		contract
	}
}

export function walletLoaded(investor, contract) {
	return {
		type: 'WALLET_LOADED',
		investor,
		contract
	}
}

export function mainWalletBalanceLoaded(balance) {
	return {
		type: 'MAIN_WALLET_BALANCE_LOADED',
		balance
	}
}

export function tokensLoaded(tokens) {
	return {
		type: 'TOKENS_LOADED',
		tokens
	}
}

export function balanceLoaded(balance) {
	return {
		type: 'BALANCE_LOADED',
		balance
	}
}

export function tradersLoaded(traders) {
	return {
		type: 'TRADERS_LOADED',
		traders
	}
}

export function traderLoaded(trader) {
	return {
		type: 'TRADER_LOADED',
		trader
	}
}

export function traderTrustRatingLoaded(trader, rating) {
	return {
		type: 'TRADER_TRUSTRATING_LOADED',
		trader,
		rating
	}
}

export function directLimitLoaded(trader, token, limit, invested) {
	return {
		type: 'DIRECT_LIMIT_LOADED',
		trader,
		token,
		limit,
		invested
	}
}

export function profitPercentagesLoaded(profitPercentages) {
	return {
		type: 'PROFIT_PERCENTAGES_LOADED',
		profitPercentages
	}
}

export function mainTraderLoaded(trader) {
	return {
		type: 'MAIN_TRADER_LOADED',
		trader
	}
}

export function traderAllocationLoaded(account, allocation) {
	allocation.trader = account
	return {
		type: 'TRADER_ALLOCATION_LOADED',
		account,
		allocation
	}
}

export function traderJoining() {
	return {
		type: 'TRADER_JOINING'
	}
}

export function investorLoaded(investor) {
	return {
		type: 'INVESTOR_LOADED',
		investor
	}
}

export function mainInvestorLoaded(investor) {
	return {
		type: 'MAIN_INVESTOR_LOADED',
		investor
	}
}

export function investorJoining() {
	return {
		type: 'INVESTOR_JOINING'
	}
}

export function investmentLoaded(investment) {
	investment.changing = false
	return {
		type: 'INVESTMENT_LOADED',
		investment
	}
}

export function investmentChanging(investment, changing) {

	investment.changing = changing
	return investmentLoaded(investment)
}

export function disbursementCreated(disbursement) {
	return {
		type: 'DISBURSEMENT_CREATED',
		disbursement
	}
}

export function traderStatisticsLoaded(trader, statistics) {
	return {
		type: 'TRADER_STATISTICS_LOADED',
		trader,
		statistics
	}
}

export function investorStatisticsLoaded(investor, statistics) {
	return {
		type: 'INVESTOR_STATISTICS_LOADED',
		investor,
		statistics
	}
}

export function tradeCountLoaded(count) {
	return {
		type: 'TRADE_COUNT_LOADED',
		count
	}
}

export function tradeLoaded(trade) {
	return {
		type: 'TRADE_LOADED',
		trade
	}
}

// export function investmentStopped(investment) {
// 	investment.changing = false
// 	return {
// 		type: 'INVESTMENT_STOPPED',
// 		investment
// 	}
// }

// export function investmentExitRequested(investment) {
// 	return {
// 		type: 'INVESTMENT_EXIT_REQUESTED',
// 		investment
// 	}
// }

// export function investmentExitApproved(investment) {
// 	return {
// 		type: 'INVESTMENT_EXIT_APPROVED',
// 		investment
// 	}
// }



