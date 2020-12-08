
const BigNumber = require('bignumber.js')
const moment = require('moment')
const sinon = require('sinon')

const allocateMysql = require('../mysql/traderpaired/allocate')

const statisticsController = require('../controller/statistics')

const { 
	collateralInvestmentProfitableStopped,
	collateralInvestmentProfitableRequested,
	collateralInvestmentProfitableRejected,
	collateralInvestmentProfitableApproved,
	directInvestmentProfitableStopped,
	directInvestmentProfitableRequested,
	directInvestmentProfitableRejected,
	directInvestmentProfitableApproved,
	collateralInvestmentLossStopped,
	collateralInvestmentLossRequested,
	collateralInvestmentLossRejected,
	collateralInvestmentLossApproved,
	directInvestmentLossStopped,
	directInvestmentLossRequested,
	directInvestmentLossRejected,
	directInvestmentLossApproved } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('Statistics_Limits', () => {

	let allocations

	beforeEach(() => {
		allocations = [{
			token: '0x0000000000000000000000000000000000000000',
			eventDate: 1234567,
			total: 1,
			invested: 0
		}]
	})

	describe('calculate limits', () => {
		beforeEach(() => {
			sinon.stub(allocateMysql, "getByTraderAndToken").returns(allocations)
		})

		afterEach(() => {
	        allocateMysql.getByTraderAndToken.restore()
	    })

		it('should get 0 for level 0 and 0 investments', async () => {
			let limits = await statisticsController.calculateLimits(
				'trader1', 
				[],
				'0'
			)
			limits.should.not.have.property('ETH')
		})

		it('should get 0 for level 0 and 1 collateral investment', async () => {
			let limits = await statisticsController.calculateLimits(
				'trader1', 
				[collateralInvestmentProfitableApproved()],
				'0'
			)
			limits.directLimits['ETH'].should.eq('0')
		})

		it('should get 5 for level 1 and 1 collateral investment', async () => {
			let limits = await statisticsController.calculateLimits(
				'trader1', 
				[collateralInvestmentProfitableApproved()],
				'1'
			)
			limits.directLimits['ETH'].should.eq('5')
		})

		it('should get 20 for level 2 and 1 collateral investment', async () => {
			let limits = await statisticsController.calculateLimits(
				'trader1', 
				[collateralInvestmentProfitableApproved()],
				'2'
			)
			limits.directLimits['ETH'].should.eq('20')
		})

	})
})