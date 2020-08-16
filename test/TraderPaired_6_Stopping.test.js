const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_6_Stopping', function () {
	const [ deployer, feeAccount, trader1, trader2, investor1, investor2, dummy ] = accounts;

	let token
	let factory
	let investments
	let platform
	
	beforeEach(async () => {
		token = await deployToken()
		factory = await deployFactory()
		investments = await deployInvestments()
		platform = await deployPlatform(token, factory, investments)
	})

	describe('stop investor', () => {

		let result
		let amount
		let value
		let investmentId
		let wallet

		beforeEach(async () => {
			amount = ether(0.6)
			value = ether(0.7)
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.allocate(ETHER, ether(1), {from: trader1})
			result = await platform.createInvestment({from: investor1})
			const log = result.logs[0]
			log.event.should.eq('Investment')
			const event = log.args
			wallet = await MultiSigFundWallet.at(event.wallet)
			await wallet.setTrader(trader1, true, {from: investor1})
			await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
			
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await wallet.stop(trader1, investmentId, {from: investor1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq('0')
				investmentObj.state.toString().should.eq('1')
			})

			it('emits an Stopped event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Stopped')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.initiator.toString().should.eq(investor1, 'initiator is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
			})
		})

		describe('failure', () => {

			let wallet2

			beforeEach(async () => {
				await platform.joinAsTrader({from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.allocate(ETHER, ether(1), {from: trader2})

				result = await platform.createInvestment({from: investor2})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet2 = await MultiSigFundWallet.at(event.wallet)
				await wallet2.setTrader(trader2, true, {from: investor2})
				await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
			})

			it('not an investor', async () => {
				await wallet.stop(trader1, investmentId, {from: trader2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with investor', async () => {
				await wallet.stop(trader1, investmentId, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not in correct state', async () => {
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('stop trader', () => {

		let result
		let amount
		let value
		let investmentId
		let wallet

		beforeEach(async () => {
			amount = ether(0.6)
			value = ether(0.7)
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.allocate(ETHER, ether(1), {from: trader1})
			result = await platform.createInvestment({from: investor1})
			const log = result.logs[0]
			log.event.should.eq('Investment')
			const event = log.args
			wallet = await MultiSigFundWallet.at(event.wallet)
			await wallet.setTrader(trader1, true, {from: investor1})
			await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
			
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await wallet.stop(trader1, investmentId, {from: trader1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq('0')
				investmentObj.state.toString().should.eq('1')
			})

			it('emits an Stopped event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Stopped')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.initiator.toString().should.eq(trader1, 'initiator is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
			})
		})

		describe('failure', () => {

			it('not in correct state', async () => {
				await wallet.stop(trader1, investmentId, {from: trader1})
				await wallet.stop(trader1, investmentId, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})
})