const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { investorCollateralProfitPercent, investorDirectProfitPercent, deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, weiFromGwei, tokens, add, subtract, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_5_Investing', function () {
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

	describe('investing collateral', () => {

		let result
		let amount
		let allocation
		let investorId
		let traderId
		let investorProfitPercent
		let walletBalance
		let wallet
		let traderBalanceBefore
		let investorBalanceBefore
		let gasUsed

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

				traderBalanceBefore = await balance.current(trader1, 'wei')
				investorBalanceBefore = await balance.current(investor1, 'wei')

				result = await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				gasUsed = result.receipt.gasUsed
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

				let traderBalanceAfter = await balance.current(trader1, 'wei')
				let investorBalanceAfter = await balance.current(investor1, 'wei')

				subtract(traderBalanceBefore, traderBalanceAfter).should.eq('0', 'trader balance should remain the same')
				// subtract(investorBalanceBefore, investorBalanceAfter).should.eq(add(amount, weiFromGwei(gasUsed)), 'investor balance should be less equal to amount invested')

				traderObj.investmentCount.toString().should.eq('1')
				investorObj.investmentCount.toString().should.eq('1')

				investmentObj.id.toString().should.eq('1')
				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.token.should.eq(ETHER)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')
				investmentObj.investorProfitPercent.toString().should.eq(investorCollateralProfitPercent.toString())
				investmentObj.investmentType.toString().should.eq('0')

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
				event.investmentType.toString().should.eq('0', 'investmentType is correct')
			})
		})

		describe('ether failure', () => {
			beforeEach(async () => {
				amount = ether(0.6)
				allocation = ether(1)
				await platform.allocate(ETHER, allocation, {from: trader1})
			})

			it('unknown investment type', async () => {
				await wallet.fundEther(trader1, 2, {from: investor1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not an investor', async () => {
				await wallet.fundEther(trader1, 0, {from: trader1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				await wallet.fundEther(trader1, 0, {from: investor2, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('more than allocation', async () => {
				amount = ether(2)
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})
		})

		describe('token success', () => {

			beforeEach(async () => {
				amount = tokens(0.6)
				allocation = tokens(1)

				await token.approve(wallet.address, amount, { from: investor1 })
				await platform.allocate(token.address, allocation, {from: trader1})

				traderBalanceBefore = await token.balanceOf(trader1)
				investorBalanceBefore = await token.balanceOf(investor1)

				result = await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				gasUsed = result.receipt.gasUsed
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

				let traderBalanceAfter = await token.balanceOf(trader1)
				let investorBalanceAfter = await token.balanceOf(investor1)

				subtract(traderBalanceBefore, traderBalanceAfter).should.eq('0', 'trader balance should remain the same')
				// subtract(investorBalanceBefore, investorBalanceAfter).should.eq(amount.toString(), 'investor balance should be less equal to amount invested')

				traderObj.investmentCount.toString().should.eq('1')
				investorObj.investmentCount.toString().should.eq('1')

				investmentObj.id.toString().should.eq('1')
				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.token.should.eq(token.address)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')
				investmentObj.investorProfitPercent.toString().should.eq(investorCollateralProfitPercent.toString())
				investmentObj.investmentType.toString().should.eq('0')

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
				event.investmentType.toString().should.eq('0', 'investmentType is correct')
			})
		})

		describe('token failure', () => {
			beforeEach(async () => {
				amount = tokens(0.6)
				allocation = tokens(1)
				await platform.allocate(token.address, allocation, {from: trader1})
			})

			it('not an investor', async () => {
				await wallet.fundToken(trader1, token.address, amount, 0, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})

			it('more than allocation', async () => {
				amount = ether(2)
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})

	describe('investing direct', () => {

		let result
		let amount
		let allocation
		let investorId
		let traderId
		let investorProfitPercent
		let walletBalance
		let wallet
		let traderBalanceBefore
		let investorBalanceBefore
		let gasUsed

		beforeEach(async () => {
			investorId = 1
			traderId = 1

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

				// await platform.allocate(ETHER, allocation, {from: trader1})

				traderBalanceBefore = await balance.current(trader1, 'wei')
				investorBalanceBefore = await balance.current(investor1, 'wei')

				result = await wallet.fundEther(trader1, 1, {from: investor1, value: amount})
				gasUsed = result.receipt.gasUsed
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
				walletBalance.toString().should.eq('0', 'direct investment does not go to wallet')

				let traderBalanceAfter = await balance.current(trader1, 'wei')
				let investorBalanceAfter = await balance.current(investor1, 'wei')

				subtract(traderBalanceAfter, traderBalanceBefore).should.eq(amount.toString(), 'trader balance should be equal to amount')
				// subtract(investorBalanceBefore, investorBalanceAfter).should.eq(add(amount, weiFromGwei(gasUsed)), 'investor balance should be less equal to amount invested')

				traderObj.investmentCount.toString().should.eq('1')
				investorObj.investmentCount.toString().should.eq('1')

				investmentObj.id.toString().should.eq('1')
				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.token.should.eq(ETHER)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')
				investmentObj.investorProfitPercent.toString().should.eq(investorDirectProfitPercent.toString())
				investmentObj.investmentType.toString().should.eq('1')

				allocation.invested.toString().should.eq('0', 'direct investment does not impact allocation')

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
				event.investmentType.toString().should.eq('1', 'investmentType is correct')
			})
		})

		describe('ether failure', () => {
			beforeEach(async () => {
				amount = ether(0.6)
				allocation = ether(1)
				await platform.allocate(ETHER, allocation, {from: trader1})
			})

			it('unknown investment type', async () => {
				await wallet.fundEther(trader1, 2, {from: investor1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not an investor', async () => {
				await wallet.fundEther(trader1, 1, {from: trader1, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				await wallet.fundEther(trader1, 1, {from: investor2, value: amount}).should.be.rejectedWith(EVM_REVERT)
			})
		})

		describe('token success', () => {

			beforeEach(async () => {
				amount = tokens(0.6)
				allocation = tokens(1)

				await token.approve(wallet.address, amount, { from: investor1 })
				// await platform.allocate(token.address, allocation, {from: trader1})

				traderBalanceBefore = await token.balanceOf(trader1)
				investorBalanceBefore = await token.balanceOf(investor1)

				result = await wallet.fundToken(trader1, token.address, amount, 1, {from: investor1})
				gasUsed = result.receipt.gasUsed
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
				walletBalance.toString().should.eq('0', 'direct investment does not go to wallet')

				let traderBalanceAfter = await token.balanceOf(trader1)
				let investorBalanceAfter = await token.balanceOf(investor1)

				subtract(traderBalanceAfter, traderBalanceBefore).should.eq(amount.toString(), 'trader balance should be equal to amount')
				// subtract(investorBalanceBefore, investorBalanceAfter).should.eq(amount.toString(), 'investor balance should be less equal to amount invested')

				traderObj.investmentCount.toString().should.eq('1')
				investorObj.investmentCount.toString().should.eq('1')

				investmentObj.id.toString().should.eq('1')
				investmentObj.trader.should.eq(trader1)
				investmentObj.investor.should.eq(investor1)
				investmentObj.token.should.eq(token.address)
				investmentObj.amount.toString().should.eq(amount.toString())
				investmentObj.state.toString().should.eq('0')
				investmentObj.investorProfitPercent.toString().should.eq(investorDirectProfitPercent.toString())
				investmentObj.investmentType.toString().should.eq('1')

				allocation.invested.toString().should.eq('0', 'direct investment does not impact allocation')

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
				event.investmentType.toString().should.eq('1', 'investmentType is correct')
			})
		})

		describe('token failure', () => {
			beforeEach(async () => {
				amount = tokens(0.6)
				allocation = tokens(1)
				await platform.allocate(token.address, allocation, {from: trader1})
			})

			it('unknown investment type', async () => {
				await wallet.fundToken(trader1, token.address, amount, 2, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('not an investor', async () => {
				await wallet.fundToken(trader1, token.address, amount, 1, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
			})

			it('investor not found', async () => {
				await wallet.fundToken(trader1, token.address, amount, 1, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
			})
		})
	})
})