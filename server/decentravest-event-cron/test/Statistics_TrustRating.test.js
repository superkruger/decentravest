
const BigNumber = require('bignumber.js')
const moment = require('moment')

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

describe('Statistics_TrustRating', () => {

	let now

	beforeEach(() => {
		now = moment("2020-06-05")
	})

	describe('calculate trust rating', () => {
		it('should get 10 for 0 investments', async () => {
			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[],
				now
			)
			trust.should.eq(10)
		})

		it('should get 8 for trader requesting wrong value', async () => {
			let investment = collateralInvestmentProfitableRequested()
			investment.value = new BigNumber(1)

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(8)
		})

		it('should get 10 for trader requesting correct value', async () => {
			let investment = collateralInvestmentProfitableRequested()

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(10)
		})

		it('should get 10 for trader requesting wrong value more than a year ago', async () => {
			let investment = collateralInvestmentProfitableRequested()
			investment.requestExitDate = moment("2019-06-05")
			investment.value = new BigNumber(1)

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(10)
		})

		it('should get 9 for trader approving too late', async () => {
			let investment = collateralInvestmentProfitableApproved()
			investment.requestExitDate = moment("2020-04-01")
			investment.approveExitDate = moment("2020-05-01")

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(9)
		})

		it('should get 10 for trader approving too late more than a year ago', async () => {
			let investment = collateralInvestmentProfitableApproved()
			investment.requestExitDate = moment("2019-04-01")
			investment.approveExitDate = moment("2019-05-01")

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(10)
		})

		it('should get 8 for trader rejecting with wrong value', async () => {
			let investment = collateralInvestmentProfitableRejected()
			investment.rejectValue = new BigNumber(1)

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(8)
		})

		it('should get 10 for trader rejecting with wrong value more than a year ago', async () => {
			let investment = collateralInvestmentProfitableRejected()
			investment.rejectValue = new BigNumber(1)
			investment.rejectExitDate = moment("2019-05-01")

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(10)
		})

		it('should get 5 for trader waiting too long', async () => {
			let investment = collateralInvestmentProfitableRequested()
			investment.requestFrom = 'investor1'
			investment.requestExitDate = moment("2020-05-20")

			let trust = await statisticsController.calculateTrustRating(
				'trader1', 
				[investment],
				now
			)
			parseInt(trust.toString()).should.eq(5)
		})

	})
})