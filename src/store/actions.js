
export function pageSelected(page) {
	return {
		type: 'PAGE_SELECTED',
		page
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

export function mainTraderLoaded(trader) {
	return {
		type: 'MAIN_TRADER_LOADED',
		trader
	}
}

export function traderAllocationLoaded(account, allocation) {
	console.log("traderAllocationLoaded", account)
	console.log("traderAllocationLoaded", allocation.invested.toString(), allocation.total.toString())
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



