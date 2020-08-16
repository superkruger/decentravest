const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_7_Exiting', function () {
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

	describe('request exit investor', () => {

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
			await wallet.stop(trader1, investmentId, {from: investor1})
		})

		describe('success', () => {

			beforeEach(async () => {

				result = await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('2')
			})

			it('emits an DisbursementCreated event', async () => {
				const log = result.logs[0]
				log.event.should.eq('DisbursementCreated')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.initiator.toString().should.eq(investor1, 'initiator is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
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
				await wallet2.stop(trader2, 2, {from: investor2})
			})

			it('not an investor', async () => {
				await wallet.disburseEther(trader1, investmentId, value, {from: trader2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investment not with investor', async () => {
				await wallet.disburseEther(trader1, investmentId, value, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not in correct state', async () => {
				await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
				await wallet.disburseEther(trader1, investmentId, value, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('request exit trader ether', () => {

		let result
		let amount
		let value
		let investmentId
		let wallet
		let walletBalance
		let settlementAmount

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
			await wallet.stop(trader1, investmentId, {from: trader1})
		})

		describe('success', () => {

			beforeEach(async () => {
				settlementAmount = ether(0.021) // 0.02 + 0.001

				result = await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('3')

				walletBalance = await balance.current(wallet.address, 'wei')
				walletBalance.toString().should.eq(add(amount, settlementAmount), 'walletBalance is correct')
			})

			it('emits an DisbursementCreated event', async () => {
				const log = result.logs[0]
				log.event.should.eq('DisbursementCreated')
				const event = log.args
				event.initiator.toString().should.eq(trader1, 'initiator is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
			})
		})

		describe('failure', () => {

			let wallet2

			beforeEach(async () => {
				settlementAmount = ether(0.021) // 0.02 + 0.001

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
				await wallet2.stop(trader2, 2, {from: trader2})
			})

			it('not an investor or trader', async () => {
				await wallet.disburseEther(trader1, investmentId, value, {from: trader2, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not in correct state', async () => {
				await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
				await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('incorrect settlementAmount', async () => {
				settlementAmount = ether(0.08)
				await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not a payment', async () => {
				await wallet.disburseEther(trader1, investmentId, value, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('request exit trader token', () => {

		let result
		let amount
		let value
		let investmentId
		let wallet
		let walletBalance
		let settlementAmount

		beforeEach(async () => {
			amount = tokens(0.6)
			value = tokens(0.7)
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})
			await platform.allocate(token.address, tokens(1), {from: trader1})
			result = await platform.createInvestment({from: investor1})
			const log = result.logs[0]
			log.event.should.eq('Investment')
			const event = log.args
			wallet = await MultiSigFundWallet.at(event.wallet)
			await wallet.setTrader(trader1, true, {from: investor1})
			await token.approve(wallet.address, amount, {from: investor1})
			await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
			await wallet.stop(trader1, investmentId, {from: trader1})
		})

		describe('success', () => {

			beforeEach(async () => {
				settlementAmount = tokens(0.021) // 0.02 + 0.001

				await token.approve(wallet.address, settlementAmount, {from: trader1})
				result = await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('3')

				walletBalance = await token.balanceOf(wallet.address)
				walletBalance.toString().should.eq(add(amount, settlementAmount), 'walletBalance is correct')
			})

			it('emits an DisbursementCreated event', async () => {
				const log = result.logs[0]
				log.event.should.eq('DisbursementCreated')
				const event = log.args
				event.initiator.toString().should.eq(trader1, 'initiator is correct')
				event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
				event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
			})
		})

		describe('failure', () => {

			let wallet2

			beforeEach(async () => {
				settlementAmount = tokens(0.021) // 0.02 + 0.001

				await platform.joinAsTrader({from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.allocate(token.address, tokens(1), {from: trader2})

				result = await platform.createInvestment({from: investor2})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet2 = await MultiSigFundWallet.at(event.wallet)
				await wallet2.setTrader(trader2, true, {from: investor2})
				await token.approve(wallet2.address, amount, {from: investor2})
				await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
				await wallet2.stop(trader2, 2, {from: trader2})
			})

			it('not an investor or trader', async () => {
				await token.approve(wallet.address, settlementAmount, {from: trader1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not in correct state', async () => {
				await token.approve(wallet.address, settlementAmount, {from: trader1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('incorrect settlementAmount', async () => {
				settlementAmount = tokens(0.08)
				await token.approve(wallet.address, settlementAmount, {from: trader1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not an approved payment', async () => {
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

})