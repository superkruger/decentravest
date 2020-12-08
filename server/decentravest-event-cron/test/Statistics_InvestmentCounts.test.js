
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

describe('Statistics_InvestmentCounts', () => {

	describe('calculate collateral profitable stopped', () => {
		it('should get ETH counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableStopped()])
			counts.should.have.property('ETH')
		})

		it('should get collateral counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableStopped()])
			counts['ETH'].should.have.property('0')
		})

		it('should get pending counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableStopped()])
			counts['ETH']['0'].should.have.property('pending')
		})

		it('should get positive counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableStopped()])
			counts['ETH']['0']['pending'].should.have.property('positive')
			let positive = counts['ETH']['0']['pending']['positive']
			// console.log(positive)
			
			positive.count.should.eq(1)
			positive.totalGrossProfit.should.eq('0.2')
			positive.totalInvestorProfit.should.eq('0.18')
			positive.totalTraderProfit.should.eq('0.78')
		})
	})

	describe('calculate collateral profitable requested', () => {
		it('should get ETH counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRequested()])
			counts.should.have.property('ETH')
		})

		it('should get collateral counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRequested()])
			counts['ETH'].should.have.property('0')
		})

		it('should get pending counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRequested()])
			counts['ETH']['0'].should.have.property('pending')
		})

		it('should get positive counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRequested()])
			counts['ETH']['0']['pending'].should.have.property('positive')
			let positive = counts['ETH']['0']['pending']['positive']

			positive.count.should.eq(1)
			positive.totalGrossProfit.should.eq('0.2')
			positive.totalInvestorProfit.should.eq('0.18')
			positive.totalTraderProfit.should.eq('0.78')
		})
	})

	describe('calculate collateral profitable rejected', () => {
		it('should get ETH counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRejected()])
			counts.should.have.property('ETH')
		})

		it('should get collateral counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRejected()])
			counts['ETH'].should.have.property('0')
		})

		it('should get rejected counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRejected()])
			counts['ETH']['0'].should.have.property('rejected')
		})

		it('should get positive counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableRejected()])
			counts['ETH']['0']['rejected'].should.have.property('positive')
			let positive = counts['ETH']['0']['rejected']['positive']
			
			positive.count.should.eq(1)
			positive.totalGrossProfit.should.eq('0.2')
			positive.totalInvestorProfit.should.eq('0.18')
			positive.totalTraderProfit.should.eq('0.78')
		})
	})

	describe('calculate collateral profitable approved', () => {
		it('should get ETH counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableApproved()])
			counts.should.have.property('ETH')
		})

		it('should get collateral counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableApproved()])
			counts['ETH'].should.have.property('0')
		})

		it('should get approved counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableApproved()])
			counts['ETH']['0'].should.have.property('approved')
		})

		it('should get positive counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([collateralInvestmentProfitableApproved()])
			counts['ETH']['0']['approved'].should.have.property('positive')
			let positive = counts['ETH']['0']['approved']['positive']
			
			positive.count.should.eq(1)
			positive.totalGrossProfit.should.eq('0.2')
			positive.totalInvestorProfit.should.eq('0.18')
			positive.totalTraderProfit.should.eq('0.78')
		})
	})

	describe('calculate collateral loss approved', () => {
		
		it('should get negative counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([
				collateralInvestmentLossApproved(), 
				collateralInvestmentLossApproved()])
			counts['ETH']['0']['approved'].should.have.property('negative')
			let negative = counts['ETH']['0']['approved']['negative']
			
			negative.count.should.eq(2)
			negative.totalGrossProfit.should.eq('2')
			negative.totalInvestorProfit.should.eq('2')
			negative.totalTraderProfit.should.eq('0.4')
		})
	})

	describe('calculate direct loss approved', () => {
		
		it('should get negative counts', async () => {
			let counts = await statisticsController.calculateInvestmentCounts([
				directInvestmentLossApproved(), 
				directInvestmentLossApproved()])
			counts['ETH']['1']['approved'].should.have.property('negative')
			let negative = counts['ETH']['1']['approved']['negative']
			
			negative.count.should.eq(2)
			negative.totalGrossProfit.should.eq('2')
			negative.totalInvestorProfit.should.eq('2')
			negative.totalTraderProfit.should.eq('0.4')
		})
	})
})