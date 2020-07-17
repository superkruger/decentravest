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

export function walletLoaded(contract) {
	return {
		type: 'WALLET_LOADED',
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

export function traderAllocationsLoaded(trader, allocations) {
	return {
		type: 'TRADER_ALLOCATIONS_LOADED',
		trader,
		allocations
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

export function investorJoining() {
	return {
		type: 'INVESTOR_JOINING'
	}
}

export function pageSelected(page) {
	return {
		type: 'PAGE_SELECTED',
		page
	}
}

export function investorInvestmentsLoaded(investments) {
	return {
		type: 'INVESTOR_INVESTMENTS_LOADED',
		investments
	}
}

// export function projectsLoaded(projects) {
// 	return {
// 		type: 'PROJECTS_LOADED',
// 		projects
// 	}
// }

// export function projectStarted(project) {
// 	return {
// 		type: 'PROJECT_STARTED',
// 		project
// 	}
// }

// export function fundingReceived(funding) {
// 	return {
// 		type: 'FUNDING_RECEIVED',
// 		funding
// 	}
// }

// export function creatorPaid(creator) {
// 	return {
// 		type: 'CREATOR_PAID',
// 		creator
// 	}
// }
