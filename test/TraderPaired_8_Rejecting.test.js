const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_8_Rejecting', function () {
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

	describe('reject exit collateral trader', () => {

		let result
		let amount
		let allocation
		let value
		let investmentId
		let settlementAmount
		let walletBalance
		let wallet
		let wallet2
		let rejectValue = ether(0.65)

		beforeEach(async () => {
			
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})

		})

		describe('ether', () => {

			beforeEach(async () => {
			
				amount = ether(0.6)
				value = ether(0.7)
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
			})

			describe('ether success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: trader1})
				})

				it('tracks reject', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)
					
					traderBalance = await balance.current(trader1, 'wei')
					investorBalance = await balance.current(investor1, 'wei')

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq(amount.toString())

					allocation.invested.toString().should.eq(amount.toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[0]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(ETHER, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq('0', 'amount is correct')
				})
			})


			describe('ether failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, ETHER, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already rejected', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: trader1})
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

		})

		describe('token', () => {

			beforeEach(async () => {
			
				amount = tokens(0.6)
				value = tokens(0.7)
				allocation = tokens(1)

				await platform.allocate(token.address, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await token.approve(wallet.address, amount, {from: investor1})
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
			})

			describe('token success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)
					
					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq(amount.toString())

					allocation.invested.toString().should.eq(amount.toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[0]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(token.address, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq('0', 'amount is correct')
				})
			})

			describe('token failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, token.address, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong trader', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader2}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader1})
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
	
	describe('reject exit collateral investor', () => {

		let result
		let amount
		let allocation
		let value
		let investmentId
		let settlementAmount
		let walletBalance
		let wallet
		let wallet2
		let rejectValue = ether(0.8)

		beforeEach(async () => {
			
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})

		})

		describe('ether', () => {

			beforeEach(async () => {
			
				amount = ether(0.6)
				value = ether(0.7)
				settlementAmount = ether(0.021) // 0.02 + 0.001
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
			})

			describe('ether success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: investor1})
				})

				it('tracks reject', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)
					
					traderBalance = await balance.current(trader1, 'wei')
					investorBalance = await balance.current(investor1, 'wei')

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq(amount.toString())

					allocation.invested.toString().should.eq(amount.toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits a Payout event', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct')
					event.to.toString().should.eq(trader1.toString(), 'to is correct')
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[1]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(ETHER, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct')
				})
			})


			describe('ether failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, ETHER, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already rejected', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: investor1})
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

		})

		describe('token', () => {

			beforeEach(async () => {
			
				amount = tokens(0.6)
				value = tokens(0.7)
				settlementAmount = tokens(0.021) // 0.02 + 0.001
				allocation = tokens(1)

				await platform.allocate(token.address, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await token.approve(wallet.address, amount, {from: investor1})
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await token.approve(wallet.address, settlementAmount, {from: trader1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
			})

			describe('token success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)
					
					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq(amount.toString())

					allocation.invested.toString().should.eq(amount.toString())

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits a Payout event', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(trader1.toString(), 'to is correct')
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[1]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(token.address, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct')
				})
			})

			describe('token failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, token.address, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong investor', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor1})
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})

	describe('reject exit direct trader', () => {

		let result
		let amount
		let allocation
		let value
		let investmentId
		let settlementAmount
		let walletBalance
		let wallet
		let wallet2
		let rejectValue = ether(0.65)

		beforeEach(async () => {
			
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})

		})

		describe('ether', () => {

			beforeEach(async () => {
			
				amount = ether(0.6)
				value = ether(0.7)
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await wallet.fundEther(trader1, 1, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
			})

			describe('ether success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: trader1})
				})

				it('tracks reject', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)
					
					traderBalance = await balance.current(trader1, 'wei')
					investorBalance = await balance.current(investor1, 'wei')

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq('0')

					allocation.invested.toString().should.eq('0')

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[0]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(ETHER, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq('0', 'amount is correct')
				})
			})


			describe('ether failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, ETHER, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already rejected', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: trader1})
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

		})

		describe('token', () => {

			beforeEach(async () => {
			
				amount = tokens(0.6)
				value = tokens(0.7)
				allocation = tokens(1)

				await platform.allocate(token.address, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await token.approve(wallet.address, amount, {from: investor1})
				await wallet.fundToken(trader1, token.address, amount, 1, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
			})

			describe('token success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)
					
					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq('0')

					allocation.invested.toString().should.eq('0')

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[0]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(token.address, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq('0', 'amount is correct')
				})
			})

			describe('token failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, token.address, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong trader', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader2}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader1})
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: trader1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
	
	describe('reject exit direct investor', () => {

		let result
		let amount
		let allocation
		let value
		let investmentId
		let settlementAmount
		let walletBalance
		let wallet
		let wallet2
		let rejectValue = ether(0.8)

		beforeEach(async () => {
			
			investmentId = 1

			await platform.joinAsTrader({from: trader1})
			await platform.joinAsInvestor({from: investor1})

		})

		describe('ether', () => {

			beforeEach(async () => {
			
				amount = ether(0.6)
				value = ether(0.7)
				settlementAmount = ether(0.681) // 0.6 + 0.08 + 0.001
				allocation = ether(1)

				await platform.allocate(ETHER, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await wallet.fundEther(trader1, 1, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
			})

			describe('ether success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: investor1})
				})

				it('tracks reject', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, ETHER)
					
					traderBalance = await balance.current(trader1, 'wei')
					investorBalance = await balance.current(investor1, 'wei')

					walletBalance = await balance.current(wallet.address, 'wei')
					walletBalance.toString().should.eq('0')

					allocation.invested.toString().should.eq('0')

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
					
				})

				it('emits a Payout event', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct')
					event.to.toString().should.eq(trader1.toString(), 'to is correct')
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[1]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(ETHER, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct')
				})
			})


			describe('ether failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, ETHER, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already rejected', async () => {
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: investor1})
					await wallet.rejectDisbursement(trader1, 0, ETHER, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})

		})

		describe('token', () => {

			beforeEach(async () => {
			
				amount = tokens(0.6)
				value = tokens(0.7)
				settlementAmount = tokens(0.681) // 0.6 + 0.08 + 0.001
				allocation = tokens(1)

				await platform.allocate(token.address, allocation, {from: trader1})
				result = await platform.createInvestment({from: investor1})
				const log = result.logs[0]
				log.event.should.eq('Investment')
				const event = log.args
				wallet = await MultiSigFundWallet.at(event.wallet)
				await wallet.setTrader(trader1, true, {from: investor1})
				await token.approve(wallet.address, amount, {from: investor1})
				await wallet.fundToken(trader1, token.address, amount, 1, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
				await token.approve(wallet.address, settlementAmount, {from: trader1})
				await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
			})

			describe('token success', () => {

				beforeEach(async () => {
					result = await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor1})
				})

				it('tracks approve', async () => {
					let investorObj, traderObj, investmentObj, allocation, traderBalance, investorBalance, feeAccountBalance
					investorObj = await platform.investors(investor1)
					traderObj = await platform.traders(trader1)
					investmentObj = await investments.investments(1)
					allocation = await platform.allocations(trader1, token.address)
					
					walletBalance = await token.balanceOf(wallet.address)
					walletBalance.toString().should.eq('0')

					allocation.invested.toString().should.eq('0')

					investmentObj.trader.should.eq(trader1)
					investmentObj.investor.should.eq(investor1)
					investmentObj.state.toString().should.eq('1', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct') // amount plus profit
					event.to.toString().should.eq(trader1.toString(), 'to is correct')
				})

				it('emits an DisbursementRejected event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[1]
					log.event.should.eq('DisbursementRejected')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
					event.token.should.eq(token.address, 'token is correct')
					event.value.toString().should.eq(rejectValue.toString(), 'value is correct')
					event.amount.toString().should.eq(settlementAmount.toString(), 'amount is correct')
				})
			})

			describe('token failure', () => {

				beforeEach(async () => {
					
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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.rejectDisbursement(trader1, 1, token.address, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})

				it('investor not found', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong investor', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor2}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor1})
					await wallet.rejectDisbursement(trader1, 0, token.address, rejectValue, {from: investor1}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
})