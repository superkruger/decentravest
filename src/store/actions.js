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

export function traderLoaded(trader) {
	return {
		type: 'TRADER_LOADED',
		trader
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

export function pageSelected(page) {
	return {
		type: 'PAGE_SELECTED',
		page
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
