const DecentraVest = artifacts.require('./DecentraVest')
const Token = artifacts.require('./Token')

import { ether, tokens, EVM_REVERT, ETHER } from './helpers'

require('chai')
	.use(require('chai-as-promised'))
	.should()

contract('DecentraVest', ([deployer, feeAccount, trader1, trader2, investor1, investor2, dummy]) => {
	let platform
	let token
	const traderFeePercent = 100
    const investorFeePercent = 100
    const investorProfitPercent = 8000

	beforeEach(async () => {
		// deploy platform
		token = await Token.new()
		platform = await DecentraVest.new(feeAccount, traderFeePercent, investorFeePercent)
	})

	// describe('deployment', () => {
	// 	it('tracks the fee account', async () => {
	// 		const result = await platform.feeAccount()
	// 		result.should.equal(feeAccount)
	// 	})

	// 	it('tracks the trader fee percent', async () => {
	// 		const result = await platform.traderFeePercent()
	// 		result.toString().should.equal(traderFeePercent.toString())
	// 	})

	// 	it('tracks the investor fee percent', async () => {
	// 		const result = await platform.investorFeePercent()
	// 		result.toString().should.equal(investorFeePercent.toString())
	// 	})
	// })

	// describe('fallback revert', () => {
	// 	it('reverts when ether is sent directly to exchange', async () => {
	// 		await platform.sendTransaction({value: 1, from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 	})
	// })

	// describe('join as trader', () => {

	// 	let result

	// 	describe('success', () => {

	// 		let investorProfitPercent
	// 		let traderId

	// 		beforeEach(async () => {
	// 			traderId = 1
	// 			investorProfitPercent = 8000
	// 			result = await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 		})

	// 		it('tracks trader', async () => {
	// 			let traderObj
	// 			traderObj = await platform.traders(trader1)

	// 			traderObj.id.toString().should.eq(traderId.toString())
	// 			traderObj.user.toString().should.eq(trader1)
	// 			traderObj.investorProfitPercent.toString().should.eq(investorProfitPercent.toString())
	// 			traderObj.investmentCount.toString().should.eq('0')
	// 		})

	// 		it('emits a Trader event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('Trader')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'address is correct')
	// 			event.traderId.toString().should.eq('1', 'traderId is correct')
	// 			event.investorProfitPercent.toString().should.eq(investorProfitPercent.toString(), 'investorProfitPercent is correct')
	// 		})
	// 	})

	// 	describe('failure', () => {

	// 		let investorProfitPercent

	// 		it('already trader', async () => {
	// 			investorProfitPercent = 8000
	// 			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 			result = await platform.joinAsTrader(investorProfitPercent, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('already investor', async () => {
	// 			investorProfitPercent = 8000
	// 			await platform.joinAsInvestor({from: trader1})
	// 			result = await platform.joinAsTrader(investorProfitPercent, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('investorProfitPercent too large', async () => {
	// 			investorProfitPercent = 10000
	// 			result = await platform.joinAsTrader(investorProfitPercent, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('investorProfitPercent too small', async () => {
	// 			investorProfitPercent = 50
	// 			result = await platform.joinAsTrader(investorProfitPercent, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})
	// 	})
	// })

	// describe('join as investor', () => {

	// 	let result

	// 	beforeEach(async () => {
	// 	})

	// 	describe('success', () => {

	// 		let investorId

	// 		beforeEach(async () => {
	// 			investorId = 1
	// 			result = await platform.joinAsInvestor({from: investor1})
	// 		})

	// 		it('tracks investor', async () => {
	// 			let investorObj
	// 			investorObj = await platform.investors(investor1)

	// 			investorObj.id.toString().should.eq(investorId.toString())
	// 			investorObj.user.toString().should.eq(investor1)
	// 		})

	// 		it('emits a Investor event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('Investor')
	// 			const event = log.args
	// 			event.investor.toString().should.eq(investor1, 'address is correct')
	// 			event.investorId.toString().should.eq('1', 'investorId is correct')
	// 		})
	// 	})

	// 	describe('failure', () => {

	// 		let investorProfitPercent

	// 		it('already trader', async () => {
	// 			let investorProfitPercent = 8000
	// 			await platform.joinAsTrader(investorProfitPercent, {from: investor1})
	// 			result = await platform.joinAsInvestor({from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('already investor', async () => {
	// 			await platform.joinAsInvestor({from: investor1})
	// 			result = await platform.joinAsInvestor({from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})
	// 	})
	// })

	// describe('allocating', () => {

	// 	let result
	// 	let amount

	// 	describe('ether success', () => {

	// 		beforeEach(async () => {
	// 			amount = ether(1)
	// 			let investorProfitPercent = 8000
	// 			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 			result = await platform.allocate(ETHER, amount, {from: trader1})
	// 		})

	// 		it('tracks ether allocation', async () => {
	// 			let allocation = await platform.allocations(trader1, ETHER)
	// 			allocation.total.toString().should.eq(amount.toString())
	// 			allocation.invested.toString().should.eq('0')
	// 		})

	// 		it('emits an Allocate event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('Allocate')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.token.should.eq(ETHER, 'token is correct')
	// 			event.amount.toString().should.eq(amount.toString(), 'amount is correct')
	// 		})
	// 	})

	// 	describe('token success', () => {

	// 		beforeEach(async () => {
	// 			amount = tokens(1)
	// 			let investorProfitPercent = 8000
	// 			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 			result = await platform.allocate(token.address, amount, {from: trader1})
	// 		})

	// 		it('tracks token allocation', async () => {
	// 			let allocation = await platform.allocations(trader1, token.address)
	// 			allocation.total.toString().should.eq(amount.toString())
	// 			allocation.invested.toString().should.eq('0')
	// 		})

	// 		it('emits an Allocate event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('Allocate')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.token.should.eq(token.address, 'token is correct')
	// 			event.amount.toString().should.eq(amount.toString(), 'amount is correct')
	// 		})
	// 	})

	// 	describe('failure', () => {

	// 		beforeEach(async () => {
	// 			amount = ether(1)
	// 			let investorProfitPercent = 8000
	// 			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 		})

	// 		it('not a trader', async () => {
	// 			result = await platform.allocate(ETHER, amount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('already allocated', async () => {
	// 			await platform.allocate(ETHER, amount, {from: trader1})
	// 			result = await platform.allocate(ETHER, amount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})
	// 	})
	// })

	// describe('investing', () => {

	// 	let result
	// 	let amount
	// 	let allocation
	// 	let investorId
	// 	let traderId
	// 	let investorProfitPercent

	// 	beforeEach(async () => {
	// 		amount = ether(0.6)
	// 		allocation = ether(1)
	// 		investorId = 1
	// 		traderId = 1
	// 		investorProfitPercent = 8000

	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 		await platform.joinAsInvestor({from: investor1})
	// 		await platform.allocate(ETHER, allocation, {from: trader1})
	// 	})

	// 	describe('ether success', () => {

	// 		beforeEach(async () => {
	// 			result = await platform.investEther(trader1, {from: investor1, value: amount})
	// 		})

	// 		it('tracks investment', async () => {
	// 			let investorObj, traderObj, investmentObj, allocation, traderInvestmentId, investorInvestmentId
	// 			investorObj = await platform.investors(investor1)
	// 			traderObj = await platform.traders(trader1)
	// 			investmentObj = await platform.investments(1)
	// 			allocation = await platform.allocations(trader1, ETHER)
	// 			traderInvestmentId = await platform.traderInvestments(trader1, 1)
	// 			investorInvestmentId = await platform.investorInvestments(investor1, 1)

	// 			traderObj.investmentCount.toString().should.eq('1')
	// 			investorObj.investmentCount.toString().should.eq('1')

	// 			investmentObj.id.toString().should.eq('1')
	// 			investmentObj.trader.should.eq(trader1)
	// 			investmentObj.investor.should.eq(investor1)
	// 			investmentObj.token.should.eq(ETHER)
	// 			investmentObj.amount.toString().should.eq(amount.toString())
	// 			investmentObj.startDate.toString().length.should.be.at.least(1)
	// 			investmentObj.state.toString().should.eq('0')

	// 			allocation.invested.toString().should.eq(ether(0.6).toString())

	// 			traderInvestmentId.toString().should.eq('1')
	// 			investorInvestmentId.toString().should.eq('1')
	// 		})

	// 		it('emits an Invest event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('Invest')
	// 			const event = log.args
	// 			event.id.toString().should.eq('1', 'id is correct')
	// 			event.investor.toString().should.eq(investor1, 'investor is correct')
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.amount.toString().should.eq(amount.toString(), 'amount is correct')
	// 		})
	// 	})

	// 	describe('ether failure', () => {

	// 		it('not an investor', async () => {
	// 			result = await platform.investEther(trader1, {from: trader1, value: amount}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('investor not found', async () => {
	// 			result = await platform.investEther(trader1, {from: investor2, value: amount}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('more than allocation', async () => {
	// 			amount = ether(2)
	// 			result = await platform.investEther(trader1, {from: investor1, value: amount}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('trader not found', async () => {
	// 			result = await platform.investEther(trader2, {from: investor1, value: amount}).should.be.rejectedWith(EVM_REVERT)
	// 		})
	// 	})
	// })

	// describe('request exit', () => {

	// 	let result
	// 	let amount
	// 	let value
	// 	let investorId
	// 	let traderId
	// 	let investmentId
	// 	let investorProfitPercent

	// 	beforeEach(async () => {
	// 		amount = ether(0.6)
	// 		value = ether(0.7)
	// 		investorId = 1
	// 		traderId = 1
	// 		investmentId = 1
	// 		investorProfitPercent = 8000

	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 		await platform.joinAsInvestor({from: investor1})
	// 		await platform.allocate(ETHER, ether(1), {from: trader1})
	// 		await platform.investEther(trader1, {from: investor1, value: amount})
	// 	})

	// 	describe('profit success', () => {

	// 		let traderProfit, investorProfit, platformFee, traderFee, investorFee

	// 		beforeEach(async () => {
	// 			investorProfit = ether(0.1) * 79 / 100
	// 			traderProfit = ether(0.1) * 19 / 100
	// 			platformFee = ether(0.1) - (ether(0.1) * 19 / 100) - investorProfit
	// 			investorFee = platformFee / 2
	// 			traderFee = platformFee - investorFee

	// 			result = await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 		})

	// 		it('tracks request', async () => {
	// 			let investmentObj
	// 			investmentObj = await platform.investments(1)

	// 			investmentObj.trader.should.eq(trader1)
	// 			investmentObj.investor.should.eq(investor1)
	// 			investmentObj.endDate.toString().should.not.eq('0'.toString())
	// 			investmentObj.value.toString().should.eq(value.toString())
	// 			investmentObj.state.toString().should.eq('1')
	// 			investmentObj.traderProfit.toString().should.eq(traderProfit.toString())
	// 			investmentObj.investorProfit.toString().should.eq(investorProfit.toString())
	// 			investmentObj.traderFee.toString().should.eq(traderFee.toString())
	// 			investmentObj.investorFee.toString().should.eq(investorFee.toString())
	// 		})

	// 		it('emits an RequestExit event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('RequestExit')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 			event.date.toString().should.not.eq('0', 'date is correct')
	// 			event.value.toString().should.eq(value.toString(), 'value is correct')
	// 			event.traderProfit.toString().should.eq(traderProfit.toString())
	// 			event.investorProfit.toString().should.eq(investorProfit.toString())
	// 			event.traderFee.toString().should.eq(traderFee.toString())
	// 			event.investorFee.toString().should.eq(investorFee.toString())
	// 		})
	// 	})

	// 	describe('breakeven success', () => {

	// 		beforeEach(async () => {
	// 			value = ether(0.6)
	// 			result = await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 		})

	// 		it('tracks request', async () => {
	// 			let investmentObj
	// 			investmentObj = await platform.investments(1)

	// 			investmentObj.trader.should.eq(trader1)
	// 			investmentObj.investor.should.eq(investor1)
	// 			investmentObj.endDate.toString().should.not.eq('0'.toString())
	// 			investmentObj.value.toString().should.eq(value.toString())
	// 			investmentObj.state.toString().should.eq('1')
	// 			investmentObj.traderProfit.toString().should.eq('0')
	// 			investmentObj.investorProfit.toString().should.eq('0')
	// 			investmentObj.traderFee.toString().should.eq('0')
	// 			investmentObj.investorFee.toString().should.eq('0')
	// 		})

	// 		it('emits an RequestExit event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('RequestExit')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 			event.date.toString().should.not.eq('0', 'date is correct')
	// 			event.value.toString().should.eq(value.toString(), 'value is correct')
	// 			event.traderProfit.toString().should.eq('0')
	// 			event.investorProfit.toString().should.eq('0')
	// 			event.traderFee.toString().should.eq('0')
	// 			event.investorFee.toString().should.eq('0')
	// 		})
	// 	})

	// 	describe('loss success', () => {

	// 		beforeEach(async () => {
	// 			value = ether(0.5)
	// 			result = await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 		})

	// 		it('tracks request', async () => {
	// 			let investmentObj
	// 			investmentObj = await platform.investments(1)

	// 			investmentObj.trader.should.eq(trader1)
	// 			investmentObj.investor.should.eq(investor1)
	// 			investmentObj.endDate.toString().should.not.eq('0'.toString())
	// 			investmentObj.value.toString().should.eq(value.toString())
	// 			investmentObj.state.toString().should.eq('1')
	// 			investmentObj.traderProfit.toString().should.eq('0')
	// 			investmentObj.investorProfit.toString().should.eq('0')
	// 			investmentObj.traderFee.toString().should.eq(ether(0.001).toString())
	// 			investmentObj.investorFee.toString().should.eq('0')
	// 		})

	// 		it('emits an RequestExit event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('RequestExit')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 			event.date.toString().should.not.eq('0', 'date is correct')
	// 			event.value.toString().should.eq(value.toString(), 'value is correct')
	// 			event.traderProfit.toString().should.eq('0')
	// 			event.investorProfit.toString().should.eq('0')
	// 			event.traderFee.toString().should.eq(ether(0.001).toString())
	// 			event.investorFee.toString().should.eq('0')
	// 		})
	// 	})

	// 	describe('failure', () => {

	// 		beforeEach(async () => {
	// 			await platform.joinAsTrader(investorProfitPercent, {from: trader2})
	// 			await platform.joinAsInvestor({from: investor2})
	// 			await platform.allocate(ETHER, ether(1), {from: trader2})
	// 			await platform.investEther(trader2, {from: investor2, value: amount})
	// 		})

	// 		it('not an investor', async () => {
	// 			result = await platform.requestExit(trader1, investmentId, value, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('investment not with trader', async () => {
	// 			result = await platform.requestExit(trader2, investmentId, value, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('trader not found', async () => {
	// 			result = await platform.requestExit(dummy, investmentId, value, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('not in correct state', async () => {
	// 			await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 			result = await platform.requestExit(trader1, investmentId, value, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})
	// 	})
	// })

	// describe('reject exit', () => {

	// 	let result
	// 	let amount
	// 	let value
	// 	let investorId
	// 	let traderId
	// 	let investmentId
	// 	let investorProfitPercent

	// 	beforeEach(async () => {
	// 		amount = ether(0.6)
	// 		value = ether(0.7)
	// 		investorId = 1
	// 		traderId = 1
	// 		investmentId = 1
	// 		investorProfitPercent = 8000

	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 		await platform.joinAsInvestor({from: investor1})
	// 		await platform.allocate(ETHER, ether(1), {from: trader1})
	// 		await platform.investEther(trader1, {from: investor1, value: amount})
	// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 	})

	// 	describe('success', () => {

	// 		beforeEach(async () => {
	// 			result = await platform.rejectExit(investmentId, {from: trader1})
	// 		})

	// 		it('tracks reject', async () => {
	// 			let investmentObj
	// 			investmentObj = await platform.investments(1)

	// 			investmentObj.trader.should.eq(trader1)
	// 			investmentObj.investor.should.eq(investor1)
	// 			investmentObj.state.toString().should.eq('2')
	// 		})

	// 		it('emits an RejectExit event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('RejectExit')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 		})
	// 	})

	// 	describe('failure', () => {

	// 		beforeEach(async () => {
	// 			await platform.joinAsTrader(investorProfitPercent, {from: trader2})
	// 			await platform.joinAsInvestor({from: investor2})
	// 			await platform.allocate(ETHER, ether(1), {from: trader2})
	// 			await platform.investEther(trader2, {from: investor2, value: amount})
	// 		})

	// 		it('not a trader', async () => {
	// 			result = await platform.rejectExit(investmentId, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('investment not with trader', async () => {
	// 			await platform.requestExit(trader2, 2, value, {from: investor2})
	// 			result = await platform.rejectExit(2, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('investmentId not found', async () => {
	// 			result = await platform.rejectExit(3, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
	// 		})

	// 		it('not in correct state', async () => {
	// 			result = await platform.rejectExit(2, {from: trader2}).should.be.rejectedWith(EVM_REVERT)
	// 		})
	// 	})
	// })

	// describe('approve exit', () => {

	// 	let result
	// 	let amount
	// 	let value
	// 	let investmentId
	// 	let investorProfitPercent
	// 	let settlementAmount

	// 	beforeEach(async () => {
	// 		amount = ether(0.6)
	// 		investmentId = 1
	// 		investorProfitPercent = 8000

	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader1})
	// 		await platform.joinAsInvestor({from: investor1})
	// 		await platform.allocate(ETHER, ether(1), {from: trader1})
	// 		await platform.investEther(trader1, {from: investor1, value: amount})
	// 	})

	// 	// describe('profit success', () => {

	// 	// 	beforeEach(async () => {

	// 	// 		value = ether(0.7)
	// 	// 		settlementAmount = ether(0.08) // 0.079 + 0.001

	// 	// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
	// 	// 	})

	// 	// 	it('tracks approve', async () => {
	// 	// 		let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
	// 	// 		investorObj = await platform.investors(investor1)
	// 	// 		traderObj = await platform.traders(trader1)
	// 	// 		investmentObj = await platform.investments(1)
	// 	// 		allocation = await platform.allocations(trader1, ETHER)
	// 	// 		traderBalance = await platform.balances(trader1, ETHER)
	// 	// 		investorBalance = await platform.balances(investor1, ETHER)
	// 	// 		feeAccountBalance = await platform.balances(feeAccount, ETHER)

	// 	// 		allocation.invested.toString().should.eq(ether(0).toString())

	// 	// 		investmentObj.trader.should.eq(trader1)
	// 	// 		investmentObj.investor.should.eq(investor1)
	// 	// 		investmentObj.state.toString().should.eq('3', 'investment state correct')

	// 	// 		investorBalance.toString().should.eq(ether(0.679).toString(), 'investor balance correct') // 0.6 + 0.079
	// 	// 		traderBalance.toString().should.eq(ether(0).toString(), 'trader balance correct')
	// 	// 		feeAccountBalance.toString().should.eq(ether(0.002).toString(), 'feeAccount balance correct')
				
	// 	// 	})

	// 	// 	it('emits an ApproveExit event', async () => {
	// 	// 		const log = result.logs[0]
	// 	// 		log.event.should.eq('ApproveExit')
	// 	// 		const event = log.args
	// 	// 		event.trader.toString().should.eq(trader1, 'trader is correct')
	// 	// 		event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 	// 		event.traderAmount.toString().should.eq(ether(0.019).toString(), 'traderAmount is correct') // profit
	// 	// 		event.investorAmount.toString().should.eq(ether(0.079).toString(), 'investorAmount is correct') // amount + profit
	// 	// 	})
	// 	// })

	// 	describe('breakeven success', () => {

	// 		beforeEach(async () => {

	// 			value = ether(0.6)
	// 			settlementAmount = ether(0)

	// 			await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 			result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
	// 		})

	// 		it('tracks approve', async () => {
	// 			let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
	// 			investorObj = await platform.investors(investor1)
	// 			traderObj = await platform.traders(trader1)
	// 			investmentObj = await platform.investments(1)
	// 			allocation = await platform.allocations(trader1, ETHER)
	// 			traderBalance = await platform.balances(trader1, ETHER)
	// 			investorBalance = await platform.balances(investor1, ETHER)
	// 			feeAccountBalance = await platform.balances(feeAccount, ETHER)

	// 			allocation.invested.toString().should.eq(ether(0).toString())

	// 			investmentObj.trader.should.eq(trader1)
	// 			investmentObj.investor.should.eq(investor1)
	// 			investmentObj.state.toString().should.eq('3', 'investment state correct')

	// 			investorBalance.toString().should.eq(ether(0.6).toString(), 'investor balance correct')
	// 			traderBalance.toString().should.eq(ether(0).toString(), 'trader balance correct')
	// 			feeAccountBalance.toString().should.eq(ether(0).toString(), 'feeAccount balance correct')
	// 		})

	// 		it('emits an ApproveExit event', async () => {
	// 			const log = result.logs[0]
	// 			log.event.should.eq('ApproveExit')
	// 			const event = log.args
	// 			event.trader.toString().should.eq(trader1, 'trader is correct')
	// 			event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 			event.traderAmount.toString().should.eq(ether(0).toString(), 'traderAmount is correct')
	// 			event.investorAmount.toString().should.eq(ether(0).toString(), 'investorAmount is correct')
	// 		})
	// 	})

	// 	// describe('loss success', () => {

	// 	// 	beforeEach(async () => {

	// 	// 		value = ether(0.5)
	// 	// 		settlementAmount = ether(0.001) // traderfee on loss

	// 	// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
	// 	// 	})

	// 	// 	it('tracks approve', async () => {
	// 	// 		let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
	// 	// 		investorObj = await platform.investors(investor1)
	// 	// 		traderObj = await platform.traders(trader1)
	// 	// 		investmentObj = await platform.investments(1)
	// 	// 		allocation = await platform.allocations(trader1, ETHER)
	// 	// 		traderBalance = await platform.balances(trader1, ETHER)
	// 	// 		investorBalance = await platform.balances(investor1, ETHER)
	// 	// 		feeAccountBalance = await platform.balances(feeAccount, ETHER)

	// 	// 		allocation.invested.toString().should.eq(ether(0).toString())

	// 	// 		investmentObj.trader.should.eq(trader1)
	// 	// 		investmentObj.investor.should.eq(investor1)
	// 	// 		investmentObj.state.toString().should.eq('3', 'investment state correct')

	// 	// 		investorBalance.toString().should.eq(ether(0.5).toString(), 'investor balance correct')
	// 	// 		traderBalance.toString().should.eq(ether(0.099).toString(), 'trader balance correct')
	// 	// 		feeAccountBalance.toString().should.eq(ether(0.001).toString(), 'feeAccount balance correct')
	// 	// 	})

	// 	// 	it('emits an ApproveExit event', async () => {
	// 	// 		const log = result.logs[0]
	// 	// 		log.event.should.eq('ApproveExit')
	// 	// 		const event = log.args
	// 	// 		event.trader.toString().should.eq(trader1, 'trader is correct')
	// 	// 		event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
	// 	// 		event.traderAmount.toString().should.eq(ether(0).toString(), 'traderAmount is correct')
	// 	// 		event.investorAmount.toString().should.eq(ether(0).toString(), 'investorAmount is correct')
	// 	// 	})
	// 	// })

	// 	// describe('profit failure', () => {

	// 	// 	beforeEach(async () => {
	// 	// 		value = ether(0.7)
	// 	// 		settlementAmount = ether(0.08) // 0.079 + 0.001

	// 	// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader2})
	// 	// 		await platform.joinAsInvestor({from: investor2})
	// 	// 		await platform.allocate(ETHER, ether(1), {from: trader2})
	// 	// 		await platform.investEther(trader2, {from: investor2, value: amount})
	// 	// 	})

	// 	// 	it('not a trader', async () => {
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('wrong settlementAmount', async () => {
	// 	// 		settlementAmount = ether(0.07)
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('investment not with trader', async () => {
	// 	// 		result = await platform.approveExitEther(2, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('trader not found', async () => {
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('not in correct state', async () => {
	// 	// 		await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})
	// 	// })

	// 	// describe('breakeven failure', () => {

	// 	// 	beforeEach(async () => {
	// 	// 		value = ether(0.6)
	// 	// 		settlementAmount = ether(0)

	// 	// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader2})
	// 	// 		await platform.joinAsInvestor({from: investor2})
	// 	// 		await platform.allocate(ETHER, ether(1), {from: trader2})
	// 	// 		await platform.investEther(trader2, {from: investor2, value: amount})
	// 	// 	})

	// 	// 	it('not a trader', async () => {
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('wrong settlementAmount', async () => {
	// 	// 		settlementAmount = ether(0.1)
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('investment not with trader', async () => {
	// 	// 		result = await platform.approveExitEther(2, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('trader not found', async () => {
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})
	// 	// })

	// 	// describe('loss failure', () => {

	// 	// 	beforeEach(async () => {
	// 	// 		value = ether(0.5)
	// 	// 		settlementAmount = ether(0.001)

	// 	// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
	// 	// 		await platform.joinAsTrader(investorProfitPercent, {from: trader2})
	// 	// 		await platform.joinAsInvestor({from: investor2})
	// 	// 		await platform.allocate(ETHER, ether(1), {from: trader2})
	// 	// 		await platform.investEther(trader2, {from: investor2, value: amount})
	// 	// 	})

	// 	// 	it('not a trader', async () => {
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('wrong settlementAmount', async () => {
	// 	// 		settlementAmount = ether(0.0001)
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('investment not with trader', async () => {
	// 	// 		result = await platform.approveExitEther(2, investor1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})

	// 	// 	it('trader not found', async () => {
	// 	// 		result = await platform.approveExitEther(investmentId, investor1, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
	// 	// 	})
	// 	// })
	// })

	describe('withdrawing', () => {

		let result
		let amount
		let withdrawAmount
		let investmentId

		beforeEach(async () => {
			amount = ether(0.6)
			investmentId = 1
			let investorProfitPercent = 8000

			await platform.joinAsTrader(investorProfitPercent, {from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.allocate(ETHER, ether(1), {from: trader1})
			await platform.investEther(trader1, {from: investor1, value: amount})
			
		})

		describe('investor success', () => {

			beforeEach(async () => {
				let value = ether(0.7)
				let settlementAmount = ether(0.08)
				withdrawAmount = ether(0.679)
				await platform.requestExit(trader1, investmentId, value, {from: investor1})
				await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
				result = await platform.withdrawEther(withdrawAmount, {from: investor1})
			})

			it('tracks ether withdraw', async () => {
				let traderBalance, investorBalance, feeAccountBalance
				traderBalance = await platform.balances(trader1, ETHER)
				investorBalance = await platform.balances(investor1, ETHER)
				feeAccountBalance = await platform.balances(feeAccount, ETHER)

				traderBalance.toString().should.eq(ether(0).toString())
				investorBalance.toString().should.eq(ether(0).toString())
				feeAccountBalance.toString().should.eq(ether(0.002).toString())
			})

			// it('emits a Withdraw event', async () => {
			// 	const log = result.logs[0]
			// 	log.event.should.eq('Withdraw')
			// 	const event = log.args
			// 	event.token.toString().should.eq(ETHER, 'token is correct')
			// 	event.user.toString().should.eq(investor1, 'user is correct')
			// 	event.amount.toString().should.eq(withdrawAmount.toString(), 'amount is correct')
			// 	event.balance.toString().should.eq(ether(0).toString(), 'balance is correct')
			// })
		})

		// describe('feeAccount success', () => {

		// 	beforeEach(async () => {
		// 		let value = ether(0.7)
		// 		let settlementAmount = ether(0.08)
		// 		withdrawAmount = ether(0.002)
		// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
		// 		await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
		// 		result = await platform.withdrawEther(withdrawAmount, {from: feeAccount})
		// 	})

		// 	it('tracks ether withdraw', async () => {
		// 		let traderBalance, investorBalance, feeAccountBalance
		// 		traderBalance = await platform.balances(trader1, ETHER)
		// 		investorBalance = await platform.balances(investor1, ETHER)
		// 		feeAccountBalance = await platform.balances(feeAccount, ETHER)

		// 		traderBalance.toString().should.eq(ether(0).toString())
		// 		investorBalance.toString().should.eq(ether(0.679).toString())
		// 		feeAccountBalance.toString().should.eq(ether(0).toString())
		// 	})

		// 	it('emits a Withdraw event', async () => {
		// 		const log = result.logs[0]
		// 		log.event.should.eq('Withdraw')
		// 		const event = log.args
		// 		event.token.toString().should.eq(ETHER, 'token is correct')
		// 		event.user.toString().should.eq(feeAccount, 'user is correct')
		// 		event.amount.toString().should.eq(withdrawAmount.toString(), 'amount is correct')
		// 		event.balance.toString().should.eq(ether(0).toString(), 'balance is correct')
		// 	})
		// })

		// describe('trader success', () => {

		// 	beforeEach(async () => {
		// 		let value = ether(0.5)
		// 		let settlementAmount = ether(0.001)
		// 		withdrawAmount = ether(0.099)
		// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
		// 		await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
		// 		result = await platform.withdrawEther(withdrawAmount, {from: trader1})
		// 	})

		// 	it('tracks ether withdraw', async () => {
		// 		let traderBalance, investorBalance, feeAccountBalance
		// 		traderBalance = await platform.balances(trader1, ETHER)
		// 		investorBalance = await platform.balances(investor1, ETHER)
		// 		feeAccountBalance = await platform.balances(feeAccount, ETHER)

		// 		traderBalance.toString().should.eq(ether(0).toString())
		// 		investorBalance.toString().should.eq(ether(0.5).toString())
		// 		feeAccountBalance.toString().should.eq(ether(0.001).toString())
		// 	})

		// 	it('emits a Withdraw event', async () => {
		// 		const log = result.logs[0]
		// 		log.event.should.eq('Withdraw')
		// 		const event = log.args
		// 		event.token.toString().should.eq(ETHER, 'token is correct')
		// 		event.user.toString().should.eq(trader1, 'user is correct')
		// 		event.amount.toString().should.eq(withdrawAmount.toString(), 'amount is correct')
		// 		event.balance.toString().should.eq(ether(0).toString(), 'balance is correct')
		// 	})
		// })

		// describe('failure', () => {

		// 	beforeEach(async () => {
		// 		let value = ether(0.7)
		// 		let settlementAmount = ether(0.08)
		// 		withdrawAmount = ether(0.679)
		// 		await platform.requestExit(trader1, investmentId, value, {from: investor1})
		// 		await platform.approveExitEther(investmentId, investor1, {from: trader1, value: settlementAmount})
		// 	})

		// 	it('not an investor', async () => {
		// 		result = await platform.withdrawEther(withdrawAmount, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
		// 	})

		// 	it('investor not found', async () => {
		// 		result = await platform.withdrawEther(withdrawAmount, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
		// 	})

		// 	it('insufficient balance', async () => {
		// 		withdrawAmount = ether(1)
		// 		result = await platform.withdrawEther(withdrawAmount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
		// 	})
		// })
	})
})