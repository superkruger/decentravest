const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const { traderFeePercent, investorFeePercent, deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_1_Deployment', function () {
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

	describe('deployment', () => {

		it('tracks the fee account', async () => {
			// await wait(1000)
			const result = await platform.feeAccount()
			// console.log(result)
			result.should.equal(feeAccount)
		})

		it('tracks the pairedInvestments address', async () => {
			const result = await platform.pairedInvestments()
			// console.log(result)
			result.should.equal(investments.address)
		})

		it('tracks the multiSigFundWalletFactory address', async () => {
			const result = await platform.multiSigFundWalletFactory()
			// console.log(result)
			result.should.equal(factory.address)
		})

		it('tracks the trader fee percent', async () => {
			const result = await investments.traderFeePercent()
			// console.log(result.toString())
			result.toString().should.equal(traderFeePercent.toString())
		})

		it('tracks the investor fee percent', async () => {
			const result = await investments.investorFeePercent()
			// console.log(result.toString())
			result.toString().should.equal(investorFeePercent.toString())
		})

		// it('tracks the investor profit percent', async () => {
		// 	const result = await investments.investorProfitPercent()
		// 	result.toString().should.equal(investorProfitPercent.toString())
		// })
	})

	describe('fallback revert', () => {
		it('reverts when ether is sent directly to exchange', async () => {
			await platform.sendTransaction({value: 1, from: trader1}).should.be.rejectedWith(EVM_REVERT)
		})
	})

})