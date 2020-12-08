
const BigNumber = require('bignumber.js')
const moment = require('moment')
const sinon = require('sinon')

const tradesMysql = require('../mysql/trades')

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

describe('Statistics_TradingRatings', () => {

	let trades_1
	let trades_2
	let trades_3
	let traders

	beforeEach(() => {
		trades_1 = [
			{
				trader: 'trader1', 
				start: 12345, 
				end: 999999999, 
				asset: 'ETH', 
				profit: 2000000000000000, 
				initialAmount: 100000000000000
			}
		]

		trades_2 = [
			{
				trader: 'trader2', 
				start: 12345, 
				end: 999999999, 
				asset: 'ETH', 
				profit: 5000000000000000, 
				initialAmount: 200000000000000
			}
		]

		trades_3 = [
			{
				trader: 'trader2', 
				start: 12345, 
				end: 999999999, 
				asset: 'ETH', 
				profit: 10000000000000000, 
				initialAmount: 300000000000000
			}
		]

		traders = [
			{
				user: 'trader1'
			},
			{
				user: 'trader2'
			},
			{
				user: 'trader3'
			}
		]
	})

	describe('calculate trading ratings', () => {
		beforeEach(() => {
			let stub = sinon.stub(tradesMysql, "getByTrader")
			stub.withArgs('trader1').returns(trades_1)
			stub.withArgs('trader2').returns(trades_2)
			stub.withArgs('trader3').returns(trades_3)
		})

		afterEach(() => {
	        tradesMysql.getByTrader.restore()
	    })

		it('should get 0 for lowest', async () => {
			let ratings = await statisticsController.calculateTradingRatings(
				'trader1', 
				traders
			)
			ratings.ratings['ETH'].should.eq('0')
			// console.log('ratings', ratings)
		})

		it('should get 10 for highest', async () => {
			let ratings = await statisticsController.calculateTradingRatings(
				'trader3', 
				traders
			)
			ratings.ratings['ETH'].should.eq('10')
			// console.log('ratings', ratings)
		})

		it('should get 3 for middle', async () => {
			let ratings = await statisticsController.calculateTradingRatings(
				'trader2', 
				traders
			)
			parseInt(ratings.ratings['ETH']).should.eq(3)
			// console.log('ratings', ratings)
		})

	})
})