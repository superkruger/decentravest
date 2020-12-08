
const statisticsController = require('../controller/statistics')

const { 
	collateralInvestmentProfitableRequested,
	collateralInvestmentLossRequested,
	collateralInvestmentProfitableApproved, 
	collateralInvestmentLossApproved, 
	directInvestmentProfitableRequested,
	directInvestmentLossRequested,
	directInvestmentProfitableApproved,
	directInvestmentLossApproved } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('Statistics_Level', () => {

	describe('calculate level 0', () => {

		it('should succeed for 0 investments', async () => {
			let level = await statisticsController.calculateLevel([], 10)
			level.should.equal(0)
		})

		it('should succeed for bad trust rating', async () => {
			let level = await statisticsController.calculateLevel([collateralInvestmentProfitableApproved()], 6)
			level.should.equal(0)
		})

		it('should succeed for losses', async () => {
			let level = await statisticsController.calculateLevel([
				collateralInvestmentLossApproved(),
				directInvestmentLossApproved()], 8)
			level.should.equal(0)
		})

		it('should succeed for unapproved', async () => {
			let level = await statisticsController.calculateLevel([
				collateralInvestmentProfitableRequested(),
				directInvestmentProfitableRequested()], 8)
			level.should.equal(0)
		})
	})

	describe('calculate level 1', () => {

		it('should succeed for 1 collateral investment', async () => {
			let level = await statisticsController.calculateLevel([collateralInvestmentProfitableApproved()], 7)
			level.should.equal(1)
		})

		it('should succeed for 1 collateral and direct investment', async () => {
			let level = await statisticsController.calculateLevel([
				collateralInvestmentProfitableApproved(),
				directInvestmentProfitableApproved()], 7)
			level.should.equal(1)
		})

		it('should succeed for required plus unapproved', async () => {
			let level = await statisticsController.calculateLevel([
				collateralInvestmentProfitableApproved(),
				collateralInvestmentProfitableRequested(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableRequested()], 7)
			level.should.equal(1)
		})

		it('should fail for insufficient investments', async () => {
			let level = await statisticsController.calculateLevel([
				directInvestmentProfitableApproved()], 7)
			level.should.equal(0)
		})

		it('should fail for insufficient trust', async () => {
			let level = await statisticsController.calculateLevel([
				collateralInvestmentProfitableApproved()], 6)
			level.should.equal(0)
		})

	})

	describe('calculate level 2', () => {

		let sufficientInvestments
		let insufficientInvestments

		beforeEach(() => {
			sufficientInvestments = [
				collateralInvestmentProfitableApproved(),
				collateralInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved()
			]
			insufficientInvestments = [
				collateralInvestmentProfitableApproved(),
				collateralInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved(),
				directInvestmentProfitableApproved()
			]
		})

		it('should succeed for sufficient investments and sufficient trust', async () => {
			let level = await statisticsController.calculateLevel(sufficientInvestments, 8)
			level.should.equal(2)
		})

		it('should fail for sufficient investments and insufficient trust', async () => {
			let level = await statisticsController.calculateLevel(sufficientInvestments, 7)
			level.should.equal(1)
		})

		it('should fail for insufficient investments and sufficient trust', async () => {
			let level = await statisticsController.calculateLevel(insufficientInvestments, 8)
			level.should.equal(1)
		})

	})
})