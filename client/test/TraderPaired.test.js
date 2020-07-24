const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');
const MultiSigFundWalletFactory = contract.fromArtifact('MultiSigFundWalletFactory');
const TraderPaired = contract.fromArtifact('TraderPaired');
const PairedInvestments = contract.fromArtifact('PairedInvestments');
const Token = contract.fromArtifact('@openzeppelin/contracts-ethereum-package/StandaloneERC20');

import { ether, tokens, add, addTokens, EVM_REVERT, ETHER } from './helpers'

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired', function () {
	const [ deployer, feeAccount, trader1, trader2, investor1, investor2, dummy ] = accounts;

	let factory
	let investments
	let platform
	let token
	const traderFeePercent = 100
    const investorFeePercent = 100
    const investorProfitPercent = 8000

	beforeEach(async () => {
		token = await Token.new()
		await token.initialize("DemoToken", "DTK", 18, tokens(1000000), deployer, [deployer], [deployer])
		// Transfer some tokens to traders and investors
		await token.transfer(trader1, tokens(100), { from: deployer })
    	await token.transfer(trader2, tokens(100), { from: deployer })
    	await token.transfer(investor1, tokens(100), { from: deployer })
    	await token.transfer(investor2, tokens(100), { from: deployer })

    	factory = await MultiSigFundWalletFactory.new()
    	// console.log("MultiSigFundWalletFactory Size", factory.constructor._json.bytecode.length)

    	investments = await PairedInvestments.new()
    	// console.log("PairedInvestments Size", investments.constructor._json.bytecode.length)
    	await investments.initialize(traderFeePercent, investorFeePercent, investorProfitPercent)

		platform = await TraderPaired.new()
		// console.log("TraderPaired Size", platform.constructor._json.bytecode.length)
		await platform.initialize(feeAccount)
		await platform.setPairedInvestments(investments.address)
		await platform.setMultiSigFundWalletFactory(factory.address)
		await platform.setToken(ETHER, true)
		await platform.setToken(token.address, true)

		await investments.setManager(platform.address)
	})

	describe('deployment', () => {

		it('tracks the fee account', async () => {
			const result = await platform.feeAccount()
			result.should.equal(feeAccount)
		})

		it('tracks the pairedInvestments address', async () => {
			const result = await platform.pairedInvestments()
			result.should.equal(investments.address)
		})

		it('tracks the multiSigFundWalletFactory address', async () => {
			const result = await platform.multiSigFundWalletFactory()
			result.should.equal(factory.address)
		})

		it('tracks the trader fee percent', async () => {
			const result = await investments.traderFeePercent()
			result.toString().should.equal(traderFeePercent.toString())
		})

		it('tracks the investor fee percent', async () => {
			const result = await investments.investorFeePercent()
			result.toString().should.equal(investorFeePercent.toString())
		})

		it('tracks the investor profit percent', async () => {
			const result = await investments.investorProfitPercent()
			result.toString().should.equal(investorProfitPercent.toString())
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

			let traderId

			beforeEach(async () => {
				traderId = 1
				result = await platform.joinAsTrader({from: trader1})
			})

			it('tracks trader', async () => {
				let traderObj
				traderObj = await platform.traders(trader1)

				traderObj.user.toString().should.eq(trader1)
				traderObj.investmentCount.toString().should.eq('0')
			})

			it('emits a Trader event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Trader')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'address is correct')
			})
		})

		describe('failure', () => {

			it('already trader', async () => {
				await platform.joinAsTrader({from: trader1})
				await platform.joinAsTrader({from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('already investor', async () => {
				await platform.joinAsInvestor({from: trader1})
				await platform.joinAsTrader({from: trader1}).should.be.rejectedWith(EVM_REVERT)
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

				investorObj.user.toString().should.eq(investor1)
			})

			it('emits a Investor event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Investor')
				const event = log.args
				event.investor.toString().should.eq(investor1, 'address is correct')
			})
		})

		describe('failure', () => {

			it('already trader', async () => {
				await platform.joinAsTrader({from: investor1})
				await platform.joinAsInvestor({from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('already investor', async () => {
				await platform.joinAsInvestor({from: investor1})
				await platform.joinAsInvestor({from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('allocating', () => {

		let result
		let amount

		describe('ether success', () => {

			beforeEach(async () => {
				amount = ether(1)
				await platform.joinAsTrader({from: trader1})
				result = await platform.allocate(ETHER, amount, {from: trader1})
			})

			it('tracks ether allocation', async () => {
				let allocation = await platform.allocations(trader1, ETHER)

				allocation.total.toString().should.eq(amount.toString())
				allocation.invested.toString().should.eq('0')
			})

			it('emits an Allocate event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Allocate')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.token.should.eq(ETHER, 'token is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
			})
		})

		describe('token success', () => {

			beforeEach(async () => {
				amount = tokens(1)
				await platform.joinAsTrader({from: trader1})
				result = await platform.allocate(token.address, amount, {from: trader1})
			})

			it('tracks token allocation', async () => {
				let allocation = await platform.allocations(trader1, token.address)
				allocation.total.toString().should.eq(amount.toString())
				allocation.invested.toString().should.eq('0')
			})

			it('emits an Allocate event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Allocate')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.token.should.eq(token.address, 'token is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
			})
		})

		describe('failure', () => {

			beforeEach(async () => {
				amount = ether(1)
				await platform.joinAsTrader({from: trader1})
			})

			it('not a trader', async () => {
				await platform.allocate(ETHER, amount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('wallet admin', () => {

		let result
		let wallet

		beforeEach(async () => {

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})
			result = await platform.createInvestment({from: investor1})
			console.log("createInvestment gas", result.receipt.gasUsed)
			const log = result.logs[0]
			log.event.should.eq('Investment')
			const event = log.args
			wallet = await MultiSigFundWallet.at(event.wallet)
		})

		describe('success', () => {

			beforeEach(async () => {
				result = await wallet.replaceAdmin(dummy, {from: feeAccount})
				console.log("replaceAdmin gas", result.receipt.gasUsed)
			})

			it('tracks replaceAdmin', async () => {
				let admin = await wallet.admin()
				admin.should.eq(dummy, 'admin is correct')	
			})
		})

		describe('failure', () => {
			beforeEach(async () => {
			})

			it('not an address', async () => {
				await wallet.replaceAdmin(ETHER, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not from current admin', async () => {
				await wallet.replaceAdmin(dummy, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('investing', () => {

		let result
		let amount
		let allocation
		let investorId
		let traderId
		let investorProfitPercent
		let walletBalance
		let wallet

		beforeEach(async () => {
			investorId = 1
			traderId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})
			result = await platform.createInvestment({from: investor1})
			console.log("createInvestment gas", result.receipt.gasUsed)
			const log = result.logs[0]
			log.event.should.eq('Investment')
			const event = log.args
			wallet = await MultiSigFundWallet.at(event.wallet)
			await wallet.setTrader(trader1, true, {from: investor1})
		})

		describe('ether success', () => {

			beforeEach(async () => {
				
				amount = ether(0.6)
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await wallet.fundEther(trader1, {from: investor1, value: amount})
				console.log("fundEther gas", result.receipt.gasUsed)
			})

			it('tracks investment', async () => {
				let investorObj, traderObj, investmentObj, allocation, traderInvestmentId, investorInvestmentId
				investorObj = await platform.investors(investor1)
				traderObj = await platform.traders(trader1)
				investmentObj = await investments.investments(1)
				allocation = await platform.allocations(trader1, ETHER)
				traderInvestmentId = await platform.traderInvestments(trader1, 1)
				investorInvestmentId = await platform.investorInvestments(investor1, 1)

				walletBalance = await balance.current(wallet.address, 'wei')
				walletBalance.toString().should.eq(amount.toString())

				traderObj.investmentCount.toString().should.eq('1')
				investorObj.investmentCount.toString().should.eq('1')

				investmentObj.id.toString().should.eq('1')
				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.token.should.eq(ETHER)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')

				allocation.invested.toString().should.eq(amount.toString())

				traderInvestmentId.toString().should.eq('1')
				investorInvestmentId.toString().should.eq('1')
			})

			it('emits an Fund event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Fund')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investor.toString().should.eq(investor1, 'investor is correct')
				event.investmentId.toString().should.eq('1', 'investmentId is correct')
				event.token.should.eq(ETHER, 'token is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
			})
		})

		describe('ether failure', () => {
			beforeEach(async () => {
				amount = ether(0.6)
				allocation = ether(1)
				await platform.allocate(ETHER, allocation, {from: trader1})
			})

			it('not an investor', async () => {
				await wallet.fundEther(trader1, {from: trader1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				await wallet.fundEther(trader1, {from: investor2, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('more than allocation', async () => {
				amount = ether(2)
				await wallet.fundEther(trader1, {from: investor1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})
		})

		describe('token success', () => {

			beforeEach(async () => {
				amount = tokens(0.6)
				allocation = tokens(1)

				await token.approve(wallet.address, amount, { from: investor1 })
				await platform.allocate(token.address, allocation, {from: trader1})

				result = await wallet.fundToken(trader1, token.address, amount, {from: investor1})
			})

			it('tracks investment', async () => {
				let investorObj, traderObj, investmentObj, allocation, traderInvestmentId, investorInvestmentId
				investorObj = await platform.investors(investor1)
				traderObj = await platform.traders(trader1)
				investmentObj = await investments.investments(1)
				allocation = await platform.allocations(trader1, token.address)
				traderInvestmentId = await platform.traderInvestments(trader1, 1)
				investorInvestmentId = await platform.investorInvestments(investor1, 1)

				walletBalance = await token.balanceOf(wallet.address)
				walletBalance.toString().should.eq(amount.toString())

				traderObj.investmentCount.toString().should.eq('1')
				investorObj.investmentCount.toString().should.eq('1')

				investmentObj.id.toString().should.eq('1')
				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.token.should.eq(token.address)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')

				allocation.invested.toString().should.eq(tokens(0.6).toString())

				traderInvestmentId.toString().should.eq('1')
				investorInvestmentId.toString().should.eq('1')
			})

			it('emits an Fund event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Fund')
				const event = log.args
				event.trader.toString().should.eq(trader1, 'trader is correct')
				event.investor.toString().should.eq(investor1, 'investor is correct')
				event.investmentId.toString().should.eq('1', 'investmentId is correct')
				event.token.should.eq(token.address, 'token is correct')
				event.amount.toString().should.eq(amount.toString(), 'amount is correct')
			})
		})

		describe('token failure', () => {
			beforeEach(async () => {
				amount = tokens(0.6)
				allocation = tokens(1)
				await platform.allocate(token.address, allocation, {from: trader1})
			})

			it('not an investor', async () => {
				await wallet.fundToken(trader1, token.address, amount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				await wallet.fundToken(trader1, token.address, amount, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('more than allocation', async () => {
				amount = ether(2)
				await wallet.fundToken(trader1, token.address, amount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
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
			result = await wallet.fundEther(trader1, {from: investor1, value: amount})
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
				investmentObj.state.toString().should.eq('1')
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
				result = await wallet2.fundEther(trader2, {from: investor2, value: amount})
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
			result = await wallet.fundEther(trader1, {from: investor1, value: amount})
		})

		describe('success', () => {

			beforeEach(async () => {
				settlementAmount = ether(0.081) // 0.08 + 0.001

				result = await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('2')

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
				settlementAmount = ether(0.081) // 0.08 + 0.001

				await platform.joinAsTrader({from: trader2})
				await platform.joinAsInvestor({from: investor2})
				await platform.allocate(ETHER, ether(1), {from: trader2})

				result = await platform.createInvestment({from: investor2})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet2 = await MultiSigFundWallet.at(event.wallet)
				await wallet2.setTrader(trader2, true, {from: investor2})
				result = await wallet2.fundEther(trader2, {from: investor2, value: amount})
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
			result = await wallet.fundToken(trader1, token.address, amount, {from: investor1})
		})

		describe('success', () => {

			beforeEach(async () => {
				settlementAmount = tokens(0.081) // 0.08 + 0.001

				await token.approve(wallet.address, settlementAmount, {from: trader1})
				result = await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
			})

			it('tracks request', async () => {
				let investmentObj
				investmentObj = await investments.investments(1)

				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.value.toString().should.eq(value.toString())
				investmentObj.state.toString().should.eq('2')

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
				settlementAmount = tokens(0.081) // 0.08 + 0.001

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
				result = await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
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

	describe('approve exit trader', () => {

		let result
		let amount
		let allocation
		let value
		let investmentId
		let settlementAmount
		let walletBalance
		let wallet
		let wallet2

		beforeEach(async () => {
			
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})

		})

		describe('ether', () => {

			beforeEach(async () => {
			
				amount = ether(0.6)
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				result = await wallet.fundEther(trader1, {from: investor1, value: amount})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.081) // 0.08 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)
					
					traderBalance = await balance.current(trader1, 'wei')
					investorBalance = await balance.current(investor1, 'wei')
					feeAccountBalance = await balance.current(feeAccount, 'wei')

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(ether(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')

					console.log("traderBalance", traderBalance.toString())
					console.log("investorBalance", investorBalance.toString())
					console.log("feeAccountBalance", feeAccountBalance.toString())
					console.log("walletBalance A", walletBalance.toString())
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.679).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.002).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(trader1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether breakeven success', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(ether(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.6).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(trader1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether loss success', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001) // traderfee on loss

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(ether(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.1).toString(), 'amount is correct') // loss
					event.to.toString().should.eq(trader1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.5).toString(), 'amount is correct') // amount minus loss
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[2]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.001).toString(), 'amount is correct') // trader fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[3]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(trader1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether profit failure', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.081) // 0.08 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(ETHER, ether(1), {from: trader2})
					await platform.allocate(ETHER, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await wallet2.fundEther(trader2, {from: investor2, value: amount})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.07)
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount})
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('ether breakeven failure', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(ETHER, ether(1), {from: trader2})
					await platform.allocate(ETHER, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await wallet2.fundEther(trader2, {from: investor2, value: amount})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.01)
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount})
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('ether loss failure', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001)

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(ETHER, ether(1), {from: trader2})
					await platform.allocate(ETHER, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await wallet2.fundEther(trader2, {from: investor2, value: amount})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.0001)
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount})
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})

		// ////////

		describe('token', () => {

			beforeEach(async () => {
			
				amount = tokens(0.6)
				allocation = tokens(1)

				await platform.allocate(token.address, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await token.approve(wallet.address, amount, {from: investor1})
				result = await wallet.fundToken(trader1, token.address, amount, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.081) // 0.08 + 0.001

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)
					
					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(tokens(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.679).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.002).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(trader1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token breakeven success', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0)

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)

					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(tokens(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.6).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(trader1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token loss success', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.001) // traderfee on loss

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)

					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(tokens(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.1).toString(), 'amount is correct') // loss
					event.to.toString().should.eq(trader1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.5).toString(), 'amount is correct') // amount minus loss
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[2]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.001).toString(), 'amount is correct') // trader fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[3]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(trader1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token profit failure', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.081) // 0.08 + 0.001

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(token.address, tokens(1), {from: trader2})
					await platform.allocate(token.address, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await token.approve(wallet2.address, amount, {from: investor2})
					await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
				})

				it('can\'t approve own disbursement', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 1, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.07)
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1})
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('token breakeven failure', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0)

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(token.address, tokens(1), {from: trader2})
					await platform.allocate(token.address, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await token.approve(wallet2.address, amount, {from: investor2})
					await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
				})

				it('can\'t approve own disbursement', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 1, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.01)
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1})
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('token loss failure', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.001)

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(token.address, tokens(1), {from: trader2})
					await platform.allocate(token.address, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await token.approve(wallet2.address, amount, {from: investor2})
					await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
				})

				it('can\'t approve own disbursement', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 1, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.0001)
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1})
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})

	describe('approve exit investor', () => {

		let result
		let amount
		let allocation
		let value
		let investmentId
		let investorProfitPercent
		let settlementAmount
		let walletBalance
		let wallet
		let wallet2

		beforeEach(async () => {
			
			investmentId = 1
			investorProfitPercent = 8000

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})

		})

		describe('ether', () => {

			beforeEach(async () => {
			
				amount = ether(0.6)
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				result = await wallet.fundEther(trader1, {from: investor1, value: amount})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.081) // 0.08 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)
					
					traderBalance = await balance.current(trader1, 'wei')
					investorBalance = await balance.current(investor1, 'wei')
					feeAccountBalance = await balance.current(feeAccount, 'wei')

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(ether(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')

					console.log("traderBalance", traderBalance.toString())
					console.log("investorBalance", investorBalance.toString())
					console.log("feeAccountBalance", feeAccountBalance.toString())
					console.log("walletBalance A", walletBalance.toString())
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.679).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.002).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(investor1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether breakeven success', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(ether(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.6).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(investor1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether loss success', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001) // traderfee on loss

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(ether(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.1).toString(), 'amount is correct') // loss
					event.to.toString().should.eq(trader1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.5).toString(), 'amount is correct') // amount minus loss
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[2]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.001).toString(), 'amount is correct') // trader fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[3]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(investor1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether profit failure', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.081) // 0.08 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(ETHER, ether(1), {from: trader2})
					await platform.allocate(ETHER, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await wallet2.fundEther(trader2, {from: investor2, value: amount})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1})
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('ether breakeven failure', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(ETHER, ether(1), {from: trader2})
					await platform.allocate(ETHER, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await wallet2.fundEther(trader2, {from: investor2, value: amount})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1})
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('ether loss failure', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001)

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(ETHER, ether(1), {from: trader2})
					await platform.allocate(ETHER, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await wallet2.fundEther(trader2, {from: investor2, value: amount})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1})
					await wallet.approveDisbursementEther(trader1, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})

		// ////////

		describe('token', () => {

			beforeEach(async () => {
			
				amount = tokens(0.6)
				allocation = tokens(1)

				await platform.allocate(token.address, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await token.approve(wallet.address, amount, {from: investor1})
				result = await wallet.fundToken(trader1, token.address, amount, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.081) // 0.08 + 0.001

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)
					
					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(tokens(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.679).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.002).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(investor1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token breakeven success', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0)

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)

					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(tokens(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.6).toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(investor1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token loss success', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.001) // traderfee on loss

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)

					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq("0")

					allocation.invested.toString().should.eq(tokens(0).toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('3', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.1).toString(), 'amount is correct') // loss
					event.to.toString().should.eq(trader1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.5).toString(), 'amount is correct') // amount minus loss
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[2]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.001).toString(), 'amount is correct') // trader fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[3]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(investor1, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token profit failure', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.081) // 0.08 + 0.001
					
					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(token.address, tokens(1), {from: trader2})
					await platform.allocate(token.address, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await token.approve(wallet2.address, amount, {from: investor2})
					await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, tokens(0.07), {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('token breakeven failure', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0)

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(token.address, tokens(1), {from: trader2})
					await platform.allocate(token.address, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await token.approve(wallet2.address, amount, {from: investor2})
					await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, tokens(0.01), {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('token loss failure', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.001)

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					
					await platform.joinAsTrader({from: trader2})
					await platform.joinAsInvestor({from: investor2})
					await platform.allocate(token.address, tokens(1), {from: trader2})
					await platform.allocate(token.address, allocation, {from: trader1})
					result = await platform.createInvestment({from: investor2})
					const log = result.logs[0]
					log.event.should.eq('Investment')
					const event = log.args
					wallet2 = await MultiSigFundWallet.at(event.wallet)
					await wallet2.setTrader(trader2, true, {from: investor2})
					await token.approve(wallet2.address, amount, {from: investor2})
					await wallet2.fundToken(trader2, token.address, amount, {from: investor2})
				})

				it('can\'t approve own disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, tokens(0.0001), {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
})