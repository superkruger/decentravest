const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const { investorCollateralProfitPercent, investorDirectProfitPercent, deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_2_Joining', function () {
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
				traderObj.investorCollateralProfitPercent.toString().should.eq(investorCollateralProfitPercent.toString())
				traderObj.investorDirectProfitPercent.toString().should.eq(investorDirectProfitPercent.toString())
			})

			it('emits a Trader event', async () => {
				const log = result.logs[0]
				log.event.should.eq('Trader')
				const event = log.args
				event.user.toString().should.eq(trader1, 'address is correct')
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
				event.user.toString().should.eq(investor1, 'address is correct')
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


})