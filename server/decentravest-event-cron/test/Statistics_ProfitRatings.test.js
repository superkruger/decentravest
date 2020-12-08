
const BigNumber = require('bignumber.js')
const moment = require('moment')
const sinon = require('sinon')

const allocateMysql = require('../mysql/traderpaired/allocate')
const investMysql = require('../mysql/traderpaired/invest')
const stopMysql = require('../mysql/traderpaired/stop')
const requestExitMysql = require('../mysql/traderpaired/requestExit')
const rejectExitMysql = require('../mysql/traderpaired/rejectExit')
const approveExitMysql = require('../mysql/traderpaired/approveExit')

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

describe('Statistics_ProfitRatings', () => {

	let invests_1, invests_2, invests_3
	let stops_1, stops_2, stops_3
	let requestExits_1, requestExits_2, requestExits_3
	let approveExits_1, approveExits_2, approveExits_3
	let trades_1, trades_2, trades_3

	let allocations
	let traders

	beforeEach(() => {
		invests_1 = [
			{
				investmentId: '1',
				trader: 'trader1', 
				eventDate: 1234567, 
				token: '0x0000000000000000000000000000000000000000', 
				amount: 1000000000000000,
				investorProfitPercent: 2000
			}
		]

		invests_2 = [
			{
				investmentId: '2',
				trader: 'trader2', 
				eventDate: 1234567, 
				token: '0x0000000000000000000000000000000000000000', 
				amount: 2000000000000000,
				investorProfitPercent: 2000
			}
		]

		invests_3 = [
			{
				investmentId: '3',
				trader: 'trader3', 
				eventDate: 1234567, 
				token: '0x0000000000000000000000000000000000000000', 
				amount: 3000000000000000,
				investorProfitPercent: 2000
			}
		]

		stops_1 = [
			{
				eventDate: 2234567
			}
		]

		stops_2 = [
			{
				eventDate: 2234567
			}
		]

		stops_3 = [
			{
				eventDate: 2234567
			}
		]

		requestExits_1 = [
			{
				eventDate: 2334567,
				value: 2000000000000000
			}
		]

		requestExits_2 = [
			{
				eventDate: 2334567,
				value: 4000000000000000
			}
		]

		requestExits_3 = [
			{
				eventDate: 2334567,
				value: 6000000000000000
			}
		]

		approveExits_1 = [
			{
				eventDate: 2434567
			}
		]

		approveExits_2 = [
			{
				eventDate: 2434567
			}
		]

		approveExits_3 = [
			{
				eventDate: 2434567
			}
		]

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

		allocations = [{
			token: '0x0000000000000000000000000000000000000000',
			eventDate: 1234567,
			total: 1,
			invested: 0
		}]

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
			let stubInvest = sinon.stub(investMysql, "getByTrader")
			stubInvest.withArgs('trader1').returns(invests_1)
			stubInvest.withArgs('trader2').returns(invests_2)
			stubInvest.withArgs('trader3').returns(invests_3)

			let stubInvestByToken = sinon.stub(investMysql, "getByTraderAndToken")
			stubInvestByToken.withArgs('trader1').returns(invests_1)
			stubInvestByToken.withArgs('trader2').returns(invests_2)
			stubInvestByToken.withArgs('trader3').returns(invests_3)

			let stubStop = sinon.stub(stopMysql, "getByTrader")
			stubStop.withArgs('trader1').returns(stops_1)
			stubStop.withArgs('trader2').returns(stops_2)
			stubStop.withArgs('trader3').returns(stops_3)

			let stubStopId = sinon.stub(stopMysql, "getByInvestmentId")
			stubStopId.withArgs('1').returns(stops_1)
			stubStopId.withArgs('2').returns(stops_2)
			stubStopId.withArgs('3').returns(stops_3)

			let stubRequestExit = sinon.stub(requestExitMysql, "getByTrader")
			stubRequestExit.withArgs('trader1').returns(requestExits_1)
			stubRequestExit.withArgs('trader2').returns(requestExits_2)
			stubRequestExit.withArgs('trader3').returns(requestExits_3)

			let stubRequestExitId = sinon.stub(requestExitMysql, "getByInvestmentId")
			stubRequestExitId.withArgs('1').returns(requestExits_1)
			stubRequestExitId.withArgs('2').returns(requestExits_2)
			stubRequestExitId.withArgs('3').returns(requestExits_3)

			sinon.stub(rejectExitMysql, "getByTrader").returns([])
			sinon.stub(rejectExitMysql, "getByInvestmentId").returns([])

			let stubApproveExit = sinon.stub(approveExitMysql, "getByTrader")
			stubApproveExit.withArgs('trader1').returns(approveExits_1)
			stubApproveExit.withArgs('trader2').returns(approveExits_2)
			stubApproveExit.withArgs('trader3').returns(approveExits_3)

			let stubApproveExitId = sinon.stub(approveExitMysql, "getByInvestmentId")
			stubApproveExitId.withArgs('1').returns(approveExits_1)
			stubApproveExitId.withArgs('2').returns(approveExits_2)
			stubApproveExitId.withArgs('3').returns(approveExits_3)

			let stubTrades = sinon.stub(tradesMysql, "getByTrader")
			stubTrades.withArgs('trader1').returns(trades_1)
			stubTrades.withArgs('trader2').returns(trades_2)
			stubTrades.withArgs('trader3').returns(trades_3)

			sinon.stub(allocateMysql, "getByTraderAndToken").returns(allocations)
		})

		afterEach(() => {
	        investMysql.getByTrader.restore()
	        investMysql.getByTraderAndToken.restore()
	        stopMysql.getByTrader.restore()
	        stopMysql.getByInvestmentId.restore()
	        requestExitMysql.getByTrader.restore()
	        requestExitMysql.getByInvestmentId.restore()
	        rejectExitMysql.getByTrader.restore()
	        rejectExitMysql.getByInvestmentId.restore()
	        approveExitMysql.getByTrader.restore()
	        approveExitMysql.getByInvestmentId.restore()
	        tradesMysql.getByTrader.restore()
	        allocateMysql.getByTraderAndToken.restore()
	    })

		it('should get 0 for lowest', async () => {
			let ratings = await statisticsController.calculateProfitRatings(
				'trader1', 
				traders
			)
			// ratings.ratings['ETH'].should.eq('0')
			// console.log('ratings', ratings)
		})

		it('should get 10 for highest', async () => {
			let ratings = await statisticsController.calculateProfitRatings(
				'trader2', 
				traders
			)
			// ratings.ratings['ETH'].should.eq('0')
			// console.log('ratings', ratings)
		})

		it('should get 3 for middle', async () => {
			let ratings = await statisticsController.calculateProfitRatings(
				'trader2', 
				traders
			)
			// ratings.ratings['ETH'].should.eq('0')
			// console.log('ratings', ratings)
		})

	})
})