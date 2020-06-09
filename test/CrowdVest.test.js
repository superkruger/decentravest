const CrowdVest = artifacts.require('./CrowdVest')

import { ether, EVM_REVERT } from './helpers'

require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('CrowdVest', ([deployer, feeAccount, trader1, trader2, investor1, investor2, dummy]) => {
	let platform
	let token
	const traderFeePercent = 100
    const investorFeePercent = 100
    const investorProfitPercent = 8000

	beforeEach(async () => {
		// deploy platform
		platform = await CrowdVest.new(feeAccount, traderFeePercent, investorFeePercent)
	})

	describe('deployment', () => {
		it('tracks the fee account', async () => {
			const result = await platform.feeAccount()
			result.should.equal(feeAccount)
		})

		it('tracks the trader fee percent', async () => {
			const result = await platform.traderFeePercent()
			result.toString().should.equal(traderFeePercent.toString())
		})

		it('tracks the investor fee percent', async () => {
			const result = await platform.investorFeePercent()
			result.toString().should.equal(investorFeePercent.toString())
		})
	})

	describe('fallback revert', () => {
		it('reverts when ether is sent directly to exchange', async () => {
			await platform.sendTransaction({value: 1, from: trader1}).should.be.rejectedWith(EVM_REVERT)
		})
	})

	describe('join as trader', () => {

		let result

		describe('success', () => {

			let investorProfitPercent
			let traderId

			beforeEach(async () => {
				traderId = 1
				investorProfitPercent = 8000
				result = await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			})

			it('tracks trader', async () => {
				let traderObj
				traderObj = await platform.traders(trader1)

				traderObj.id.toString().should.eq(traderId.toString())
				traderObj.user.toString().should.eq(trader1)
				traderObj.investorProfitPercent.toString().should.eq(investorProfitPercent.toString())
				traderObj.balance.toString().should.eq(ether(0).toString())
				traderObj.investmentCount.toString().should.eq('0')
			})

			it('emits a Trader event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Trader')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'address is correct')
				event.traderId.toString().should.eq('1', 'traderId is correct')
				event.investorProfitPercent.toString().should.eq(investorProfitPercent.toString(), 'investorProfitPercent is correct')
			})
		})

		describe('failure', () => {

			let investorProfitPercent

			it('investorProfitPercent too large', async () => {
				investorProfitPercent = 10000
				result = await platform.joinAsTrader(investorProfitPercent, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investorProfitPercent too small', async () => {
				investorProfitPercent = 50
				result = await platform.joinAsTrader(investorProfitPercent, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('join as investor', () => {

		let result

		beforeEach(async () => {
		})

		describe('success', () => {

			let investorId

			beforeEach(async () => {
				investorId = 1
				result = await platform.joinAsInvestor({from: investor1})
			})

			it('tracks investor', async () => {
				let investorObj
				investorObj = await platform.investors(investor1)

				investorObj.id.toString().should.eq(investorId.toString())
				investorObj.user.toString().should.eq(investor1)
				investorObj.balance.toString().should.eq(ether(0).toString())
			})

			it('emits a Investor event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Investor')
				const event = log.args
				event.investor.toString().should.eq(investor1, 'address is correct')
				event.investorId.toString().should.eq('1', 'investorId is correct')
			})
		})
	})

	describe('depositing', () => {

		let result
		let amount
		let investorId

		describe('success', () => {

			beforeEach(async () => {
				amount = ether(1)
				investorId = 1
				await platform.joinAsInvestor({from: investor1})
				result = await platform.deposit({from: investor1, value: amount})
			})

			it('tracks ether deposit', async () => {
				let investorObj
				investorObj = await platform.investors(investor1)
				investorObj.balance.toString().should.eq(amount.toString())
			})

			it('emits a Deposit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Deposit')
				const event = log.args
				event.investor.toString().should.eq(investor1, 'investor is correct')
				event.investorId.toString().should.eq(investorId.toString(), 'investorId is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
				event.balance.toString().should.eq(amount.toString(), 'balance is correct')
			})
		})

		describe('failure', () => {

			beforeEach(async () => {
				amount = ether(1)
				investorId = 1

				await platform.joinAsInvestor({from: investor1})
			})

			it('not an investor', async () => {
				result = await platform.deposit({from: trader1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				result = await platform.deposit({from: investor2, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('withdrawing', () => {

		let result
		let amount
		let investorId

		beforeEach(async () => {
			amount = ether(0.6)
			investorId = 1
			await platform.joinAsInvestor({from: investor1})
			await platform.deposit({from: investor1, value: ether(1)})
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await platform.withdraw(amount, {from: investor1})
			})

			it('tracks ether withdraw', async () => {
				let investorObj
				investorObj = await platform.investors(investor1)
				investorObj.balance.toString().should.eq(ether(0.4).toString())
			})

			it('emits a Withdraw event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Withdraw')
				const event = log.args
				event.investor.toString().should.eq(investor1, 'investor is correct')
				event.investorId.toString().should.eq(investorId.toString(), 'investorId is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
				event.balance.toString().should.eq(ether(0.4).toString(), 'balance is correct')
			})
		})

		describe('failure', () => {

			it('not an investor', async () => {
				result = await platform.withdraw(amount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				result = await platform.withdraw(amount, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('insufficient balance', async () => {
				amount = ether(2)
				result = await platform.withdraw(amount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('investing', () => {

		let result
		let amount
		let investorId
		let traderId
		let investorProfitPercent

		beforeEach(async () => {
			amount = ether(0.6)
			investorId = 1
			traderId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.deposit({from: investor1, value: ether(1)})
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await platform.invest(trader1, amount, {from: investor1})
			})

			it('tracks investment', async () => {
				let investorObj, traderObj, investmentObj
				investorObj = await platform.investors(investor1)
				traderObj = await platform.traders(trader1)
				investmentObj = await platform.investments(trader1, traderObj.investmentCount)

				investorObj.balance.toString().should.eq(ether(0.4).toString())
				traderObj.balance.toString().should.eq(amount.toString())

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')
			})

			it('emits an Invest event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Invest')
				const event = log.args
				event.id.toString().should.eq('1', 'id is correct')
				event.investor.toString().should.eq(investor1, 'investor is correct')
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
				event.balance.toString().should.eq(ether(0.4).toString(), 'balance is correct')
			})
		})

		describe('failure', () => {

			it('not an investor', async () => {
				result = await platform.invest(trader1, amount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				result = await platform.invest(trader1, amount, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('insufficient balance', async () => {
				amount = ether(2)
				result = await platform.invest(trader1, amount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('trader not found', async () => {
				result = await platform.invest(trader2, amount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

		})
	})

	describe('request exit', () => {

		let result
		let amount
		let value
		let investorId
		let traderId
		let investmentId
		let investorProfitPercent

		beforeEach(async () => {
			amount = ether(0.6)
			value = ether(0.7)
			investorId = 1
			traderId = 1
			investmentId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.deposit({from: investor1, value: ether(1)})
			await platform.invest(trader1, amount, {from: investor1})
		})

		describe('profit success', () => {

			let investorProfit, platformFee

			beforeEach(async () => {
				investorProfit = ether(0.1) * 79 / 100
				platformFee = ether(0.1) - (ether(0.1) * 19 / 100) - investorProfit

				result = await platform.requestExit(trader1, investmentId, value, {from: investor1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await platform.investments(trader1, 1)

				investmentObj.endDate.toString().should.not.eq('0'.toString())
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('1')
				investmentObj.investorProfit.toString().should.eq(investorProfit.toString())
				investmentObj.platformFee.toString().should.eq(platformFee.toString())
			})

			it('emits an RequestExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('RequestExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.date.toString().should.not.eq('0', 'date is correct')
				event.value.toString().should.eq(value.toString(), 'value is correct')
				event.investorProfit.toString().should.eq(investorProfit.toString())
				event.platformFee.toString().should.eq(platformFee.toString())
			})
		})

		describe('breakeven success', () => {

			beforeEach(async () => {
				value = ether(0.6)
				result = await platform.requestExit(trader1, investmentId, value, {from: investor1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await platform.investments(trader1, 1)

				investmentObj.endDate.toString().should.not.eq('0'.toString())
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('1')
				investmentObj.investorProfit.toString().should.eq('0')
				investmentObj.platformFee.toString().should.eq('0')
			})

			it('emits an RequestExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('RequestExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.date.toString().should.not.eq('0', 'date is correct')
				event.value.toString().should.eq(value.toString(), 'value is correct')
				event.investorProfit.toString().should.eq('0')
				event.platformFee.toString().should.eq('0')
			})
		})

		describe('loss success', () => {

			beforeEach(async () => {
				value = ether(0.5)
				result = await platform.requestExit(trader1, investmentId, value, {from: investor1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await platform.investments(trader1, 1)

				investmentObj.endDate.toString().should.not.eq('0'.toString())
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('1')
				investmentObj.investorProfit.toString().should.eq('0')
				investmentObj.platformFee.toString().should.eq('0')
			})

			it('emits an RequestExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('RequestExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.date.toString().should.not.eq('0', 'date is correct')
				event.value.toString().should.eq(value.toString(), 'value is correct')
				event.investorProfit.toString().should.eq('0')
				event.platformFee.toString().should.eq('0')
			})
		})

		describe('failure', () => {

			beforeEach(async () => {
				await platform.joinAsTrader(investorProfitPercent, {from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.deposit({from: investor2, value: ether(1)})
				await platform.invest(trader2, amount, {from: investor2})
			})

			it('not an investor', async () => {
				result = await platform.requestExit(trader1, investmentId, value, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with trader', async () => {
				result = await platform.requestExit(trader2, investmentId, value, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('trader not found', async () => {
				result = await platform.requestExit(dummy, investmentId, value, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

		})
	})

	describe('cancel exit', () => {

		let result
		let amount
		let value
		let investorId
		let traderId
		let investmentId
		let investorProfitPercent

		beforeEach(async () => {
			amount = ether(0.6)
			value = ether(0.7)
			investorId = 1
			traderId = 1
			investmentId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.deposit({from: investor1, value: ether(1)})
			await platform.invest(trader1, amount, {from: investor1})
			await platform.requestExit(trader1, investmentId, value, {from: investor1})
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await platform.cancelExit(trader1, investmentId, {from: investor1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await platform.investments(trader1, 1)

				investmentObj.state.toString().should.eq('0')
			})

			it('emits an CancelExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('CancelExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
			})
		})

		describe('failure', () => {

			beforeEach(async () => {
				await platform.joinAsTrader(investorProfitPercent, {from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.deposit({from: investor2, value: ether(1)})
				await platform.invest(trader2, amount, {from: investor2})
			})

			it('not an investor', async () => {
				result = await platform.cancelExit(trader1, investmentId, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with trader', async () => {
				result = await platform.cancelExit(trader2, investmentId, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('trader not found', async () => {
				result = await platform.cancelExit(dummy, investmentId, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

		})
	})

	describe('reject exit', () => {

		let result
		let amount
		let value
		let investorId
		let traderId
		let investmentId
		let investorProfitPercent

		beforeEach(async () => {
			amount = ether(0.6)
			value = ether(0.7)
			investorId = 1
			traderId = 1
			investmentId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.deposit({from: investor1, value: ether(1)})
			await platform.invest(trader1, amount, {from: investor1})
			await platform.requestExit(trader1, investmentId, value, {from: investor1})
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await platform.rejectExit(investmentId, {from: trader1})
			})

			it('tracks reject', async () => {
				let investmentObj
				investmentObj = await platform.investments(trader1, 1)

				investmentObj.state.toString().should.eq('2')
			})

			it('emits an RejectExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('RejectExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
			})
		})

		describe('failure', () => {

			beforeEach(async () => {
				await platform.joinAsTrader(investorProfitPercent, {from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.deposit({from: investor2, value: ether(1)})
				await platform.invest(trader2, amount, {from: investor2})
			})

			it('not a trader', async () => {
				result = await platform.rejectExit(investmentId, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with trader', async () => {
				result = await platform.rejectExit(2, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investmentId not found', async () => {
				result = await platform.rejectExit(3, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

		})
	})

	describe('approve exit', () => {

		let result
		let amount
		let value
		let investorId
		let traderId
		let investmentId
		let investorProfitPercent
		let settlementAmount

		beforeEach(async () => {
			amount = ether(0.6)
			investorId = 1
			traderId = 1
			investmentId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.deposit({from: investor1, value: ether(1)})
			await platform.invest(trader1, amount, {from: investor1})
		})

		describe('profit success', () => {


			beforeEach(async () => {

				value = ether(0.7)
				settlementAmount = ether(0.681) // 0.6 + 0.079 + 0.002

				await platform.requestExit(trader1, investmentId, value, {from: investor1})
				result = await platform.approveExit(investmentId, investor1, {from: trader1, value: settlementAmount})
			})

			it('tracks approve', async () => {
				let investorObj, traderObj, investmentObj
				investorObj = await platform.investors(investor1)
				traderObj = await platform.traders(trader1)
				investmentObj = await platform.investments(trader1, 1)

				investorObj.balance.toString().should.eq(ether(1.079).toString(), 'investor balance correct') // 0.4 + 0.6 + 0.079
				traderObj.balance.toString().should.eq(ether(0).toString(), 'trader balance correct')
				investmentObj.state.toString().should.eq('3', 'investment state correct')
			})

			it('emits an ApproveExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('ApproveExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.nettAmount.toString().should.eq(ether(0.679).toString(), 'nettAmount is correct') // 0.6 + 0.079
			})
		})

		describe('breakeven success', () => {

			beforeEach(async () => {

				value = ether(0.6)
				settlementAmount = ether(0.6)

				await platform.requestExit(trader1, investmentId, value, {from: investor1})
				result = await platform.approveExit(investmentId, investor1, {from: trader1, value: settlementAmount})
			})

			it('tracks approve', async () => {
				let investorObj, traderObj, investmentObj
				investorObj = await platform.investors(investor1)
				traderObj = await platform.traders(trader1)
				investmentObj = await platform.investments(trader1, 1)

				investorObj.balance.toString().should.eq(ether(1).toString(), 'investor balance correct')
				traderObj.balance.toString().should.eq(ether(0).toString(), 'trader balance correct')
				investmentObj.state.toString().should.eq('3', 'investment state correct')
			})

			it('emits an ApproveExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('ApproveExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.nettAmount.toString().should.eq(ether(0.6).toString(), 'nettAmount is correct')
			})
		})

		describe('loss success', () => {

			beforeEach(async () => {

				value = ether(0.5)
				settlementAmount = ether(0.5)

				await platform.requestExit(trader1, investmentId, value, {from: investor1})
				result = await platform.approveExit(investmentId, investor1, {from: trader1, value: settlementAmount})
			})

			it('tracks approve', async () => {
				let investorObj, traderObj, investmentObj
				investorObj = await platform.investors(investor1)
				traderObj = await platform.traders(trader1)
				investmentObj = await platform.investments(trader1, 1)

				investorObj.balance.toString().should.eq(ether(0.9).toString(), 'investor balance correct')
				traderObj.balance.toString().should.eq(ether(0).toString(), 'trader balance correct')
				investmentObj.state.toString().should.eq('3', 'investment state correct')
			})

			it('emits an ApproveExit event', async () => {
				const log = result.logs[0]
				log.event.should.eq('ApproveExit')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.nettAmount.toString().should.eq(ether(0.5).toString(), 'nettAmount is correct')
			})
		})

		describe('profit failure', () => {

			beforeEach(async () => {
				value = ether(0.7)
				settlementAmount = ether(0.681)

				platform.requestExit(trader1, investmentId, value, {from: investor1})
				await platform.joinAsTrader(investorProfitPercent, {from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.deposit({from: investor2, value: ether(1)})
				await platform.invest(trader2, amount, {from: investor2})
			})

			it('not a trader', async () => {
				result = await platform.approveExit(investmentId, investor1, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('wrong settlementAmount', async () => {
				settlementAmount = ether(0.6)
				result = await platform.approveExit(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with trader', async () => {
				result = await platform.approveExit(2, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('trader not found', async () => {
				result = await platform.approveExit(investmentId, investor1, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})
		})

		describe('breakeven failure', () => {

			beforeEach(async () => {
				value = ether(0.6)
				settlementAmount = ether(0.6)

				platform.requestExit(trader1, investmentId, value, {from: investor1})
				await platform.joinAsTrader(investorProfitPercent, {from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.deposit({from: investor2, value: ether(1)})
				await platform.invest(trader2, amount, {from: investor2})
			})

			it('not a trader', async () => {
				result = await platform.approveExit(investmentId, investor1, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('wrong settlementAmount', async () => {
				settlementAmount = ether(0.5)
				result = await platform.approveExit(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with trader', async () => {
				result = await platform.approveExit(2, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('trader not found', async () => {
				result = await platform.approveExit(investmentId, investor1, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})
		})

		describe('loss failure', () => {

			beforeEach(async () => {
				value = ether(0.5)
				settlementAmount = ether(0.5)

				platform.requestExit(trader1, investmentId, value, {from: investor1})
				await platform.joinAsTrader(investorProfitPercent, {from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.deposit({from: investor2, value: ether(1)})
				await platform.invest(trader2, amount, {from: investor2})
			})

			it('not a trader', async () => {
				result = await platform.approveExit(investmentId, investor1, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('wrong settlementAmount', async () => {
				settlementAmount = ether(0.4)
				result = await platform.approveExit(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with trader', async () => {
				result = await platform.approveExit(2, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('trader not found', async () => {
				result = await platform.approveExit(investmentId, investor1, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})
})