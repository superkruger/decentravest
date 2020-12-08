
const BigNumber = require('bignumber.js')
const moment = require('moment')


const investment = () => {
	return {
		token: '0x0000000000000000000000000000000000000000',
		startDate: moment('2020-02-01')
	}
}

const investmentProfitable = () => {
	return {
		amount: new BigNumber(1),
		value: new BigNumber(2),
		grossValue: new BigNumber(2),
		nettValue: new BigNumber(1.18),
		grossProfit: new BigNumber(0.2),
		investorProfit: new BigNumber(0.18),
		traderProfit: new BigNumber(0.78)
	}
}

const investmentLoss = () => {
	return {
		amount: new BigNumber(2),
		value: new BigNumber(1),
		grossValue: new BigNumber(1),
		nettValue: new BigNumber(1),
		grossProfit: new BigNumber(-1),
		investorProfit: new BigNumber(-1),
		traderProfit: new BigNumber(-0.2)
	}
}

const collateralInvestment = () => {
	return {
		investmentType: 0
	}
}

const directInvestment = () => {
	return {
		investmentType: 1
	}
}

const stoppedInvestorInvestment = () => {
	return {
		stopFrom: 'investor1'

	}
}

const requestedInvestorInvestment = () => {
	return {
		requestFrom: 'investor1',
		requestExitDate: moment("2020-06-01")
	}
}

const rejectedInvestorInvestment = () => {
	return {
		... requestedTraderInvestment(),
		rejectFrom: 'investor1',
		rejectExitDate: moment("2020-06-02"),
		rejectValue: new BigNumber(2)
	}
}

const approvedInvestorInvestment = () => {
	return {
		... requestedTraderInvestment(),
		approveFrom: 'investor1',
		approveExitDate: moment("2020-06-02")
	}
}

const stoppedTraderInvestment = () => {
	return {
		stopFrom: 'trader1',
	}
}

const requestedTraderInvestment = () => {
	return {
		requestFrom: 'trader1',
		requestExitDate: moment("2020-06-01")
	}
}

const rejectedTraderInvestment = () => {
	return {
		... requestedInvestorInvestment(),
		rejectFrom: 'trader1',
		rejectExitDate: moment("2020-06-02"),
		rejectValue: new BigNumber(2)
	}
}

const approvedTraderInvestment = () => {
	return {
		... requestedInvestorInvestment(),
		approveFrom: 'trader1',
		approveExitDate: moment("2020-06-02")
	}
}

const collateralInvestmentProfitable = () => {
	return {
		... investment(),
		... investmentProfitable(),
		... collateralInvestment()
	}
}

const collateralInvestmentLoss = () => {
	return {
		... investment(),
		... investmentLoss(),
		... collateralInvestment()
	}
}

const directInvestmentProfitable = () => {
	return {
		... investment(),
		... investmentProfitable(),
		... directInvestment()
	}
}

const directInvestmentLoss = () => {
	return {
		... investment(),
		... investmentLoss(),
		... directInvestment()
	}
}

/// collateral

const collateralInvestmentProfitableStopped = () => {
	return {
		... collateralInvestmentProfitable(),
		... stoppedTraderInvestment()
	}
}
module.exports.collateralInvestmentProfitableStopped = collateralInvestmentProfitableStopped

const collateralInvestmentLossStopped = () => {
	return {
		... collateralInvestmentLoss(),
		... stoppedTraderInvestment()
	}
}
module.exports.collateralInvestmentLossStopped = collateralInvestmentLossStopped

const collateralInvestmentProfitableRejected = () => {
	return {
		... collateralInvestmentProfitable(),
		... rejectedTraderInvestment()
	}
}
module.exports.collateralInvestmentProfitableRejected = collateralInvestmentProfitableRejected

const collateralInvestmentLossRejected = () => {
	return {
		... collateralInvestmentLoss(),
		... rejectedTraderInvestment()
	}
}
module.exports.collateralInvestmentLossRejected = collateralInvestmentLossRejected

const collateralInvestmentProfitableRequested = () => {
	return {
		... collateralInvestmentProfitable(),
		... requestedTraderInvestment()
	}
}
module.exports.collateralInvestmentProfitableRequested = collateralInvestmentProfitableRequested

const collateralInvestmentLossRequested = () => {
	return {
		... collateralInvestmentLoss(),
		... requestedTraderInvestment()
	}
}
module.exports.collateralInvestmentLossRequested = collateralInvestmentLossRequested

const collateralInvestmentProfitableApproved = () => {
	return {
		... collateralInvestmentProfitable(),
		... approvedTraderInvestment()
	}
}
module.exports.collateralInvestmentProfitableApproved = collateralInvestmentProfitableApproved

const collateralInvestmentLossApproved = () => {
	return {
		... collateralInvestmentLoss(),
		... approvedTraderInvestment()
	}
}
module.exports.collateralInvestmentLossApproved = collateralInvestmentLossApproved

/// direct

const directInvestmentProfitableStopped = () => {
	return {
		... directInvestmentProfitable(),
		... stoppedTraderInvestment()
	}
}
module.exports.directInvestmentProfitableStopped = directInvestmentProfitableStopped

const directInvestmentLossStopped = () => {
	return {
		... directInvestmentLoss(),
		... stoppedTraderInvestment()
	}
}
module.exports.directInvestmentLossStopped = directInvestmentLossStopped

const directInvestmentProfitableRejected = () => {
	return {
		... directInvestmentProfitable(),
		... rejectedTraderInvestment()
	}
}
module.exports.directInvestmentProfitableRejected = directInvestmentProfitableRejected

const directInvestmentLossRejected = () => {
	return {
		... directInvestmentLoss(),
		... rejectedTraderInvestment()
	}
}
module.exports.directInvestmentLossRejected = directInvestmentLossRejected

const directInvestmentProfitableRequested = () => {
	return {
		... directInvestmentProfitable(),
		... requestedTraderInvestment()
	}
}
module.exports.directInvestmentProfitableRequested = directInvestmentProfitableRequested

const directInvestmentLossRequested = () => {
	return {
		... directInvestmentLoss(),
		... requestedTraderInvestment()
	}
}
module.exports.directInvestmentLossRequested = directInvestmentLossRequested

const directInvestmentProfitableApproved = () => {
	return {
		... directInvestmentProfitable(),
		... approvedTraderInvestment()
	}
}
module.exports.directInvestmentProfitableApproved = directInvestmentProfitableApproved

const directInvestmentLossApproved = () => {
	return {
		... directInvestmentLoss(),
		... approvedTraderInvestment()
	}
}
module.exports.directInvestmentLossApproved = directInvestmentLossApproved
