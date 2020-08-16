const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_3_Wallet', function () {
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
				// console.log("replaceAdmin gas", result.receipt.gasUsed)
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

})