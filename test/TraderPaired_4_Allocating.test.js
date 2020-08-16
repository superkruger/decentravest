const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_4_Allocating', function () {
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
				event.total.toString().should.eq(amount.toString(), 'total is correct')
				event.invested.toString().should.eq('0', 'invested is correct')
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
				event.total.toString().should.eq(amount.toString(), 'total is correct')
				event.invested.toString().should.eq('0', 'invested is correct')
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
})