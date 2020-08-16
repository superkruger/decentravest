const { accounts, contract } = require('@openzeppelin/test-environment');
const { BN, expectEvent, expectRevert, balance } = require('@openzeppelin/test-helpers');

const MultiSigFundWallet = contract.fromArtifact('MultiSigFundWallet');

const { deployToken, deployFactory, deployInvestments, deployPlatform, wait, ether, tokens, add, EVM_REVERT, ETHER } = require('./helpers.js')

require('chai')
	.use(require('chai-as-promised'))
	.should()

describe('TraderPaired_9_Approving', function () {
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

	describe('approve exit trader collateral', () => {

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
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.619).toString(), 'amount is correct') // amount plus profit
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.619).toString(), 'amount is correct') // amount plus profit
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					settlementAmount = tokens(0.021) // 0.02 + 0.001

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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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

	describe('approve exit investor collateral', () => {

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
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.619).toString(), 'amount is correct') // amount plus profit
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.619).toString(), 'amount is correct') // amount plus profit
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					settlementAmount = tokens(0.021) // 0.02 + 0.001
					
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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

	describe('approve exit investor admin collateral', () => {

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
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.599).toString(), 'amount is correct') // amount minus fee
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.001).toString(), 'amount is correct') // investor fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether breakeven success', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.6).toString(), 'amount is correct') // amount
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether loss success', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001) // traderfee on loss

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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

				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether profit failure', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.07)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.01)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.0001)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.599).toString(), 'amount is correct') // amount minus fee
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.001).toString(), 'amount is correct') // investor fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token breakeven success', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0)

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.6).toString(), 'amount is correct') // amount
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token loss success', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.001) // traderfee on loss

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token profit failure', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.07)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.01)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.0001)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})

	describe('approve exit trader admin collateral', () => {

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
				await wallet.fundEther(trader1, 0, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.619).toString(), 'amount is correct') // amount plus profit
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
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether breakeven success', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether loss success', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001) // traderfee on loss

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether profit failure', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundEther(trader2, 0, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
				await wallet.fundToken(trader1, token.address, amount, 0, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.619).toString(), 'amount is correct') // amount plus profit
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
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
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
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
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
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token profit failure', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001
					
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, tokens(0.07), {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, tokens(0.01), {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundToken(trader2, token.address, amount, 0, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, tokens(0.0001), {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})

	describe('approve exit trader direct', () => {

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
				await wallet.fundEther(trader1, 1, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.681) // 0.6 + 0.08 + 0.001

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
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
					settlementAmount = ether(0.6)

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					settlementAmount = ether(0.501) // traderfee on loss

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.5).toString(), 'amount is correct') // amount minus loss
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.001).toString(), 'amount is correct') // trader fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[2]
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
					settlementAmount = ether(0.681) // 0.6 + 0.08 + 0.001

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					settlementAmount = ether(0.6)

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					settlementAmount = ether(0.501)

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
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
				await wallet.fundToken(trader1, token.address, amount, 1, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.681) // 0.6 + 0.08 + 0.001

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
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
					settlementAmount = tokens(0.6)

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
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
					settlementAmount = tokens(0.501) // traderfee on loss

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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.5).toString(), 'amount is correct') // amount minus loss
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.001).toString(), 'amount is correct') // trader fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[2]
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
					settlementAmount = tokens(0.681) // 0.6 + 0.08 + 0.001

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					settlementAmount = tokens(0.6)

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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
					settlementAmount = tokens(0.501)

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
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

	describe('approve exit investor admin direct', () => {

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
				await wallet.fundEther(trader1, 1, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[0]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether breakeven success', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0)

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[0]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether loss success', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.001) // traderfee on loss

					await wallet.disburseEther(trader1, investmentId, value, {from: investor1})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[0]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether profit failure', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.021) // 0.02 + 0.001

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.07)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.01)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.0001)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
				await wallet.fundToken(trader1, token.address, amount, 1, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[0]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token breakeven success', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0)

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[0]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token loss success', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.001) // traderfee on loss

					await wallet.disburseToken(trader1, investmentId, token.address, value, 0, {from: investor1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[0]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(investor1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token profit failure', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.021) // 0.02 + 0.001

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.07)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.01)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.0001)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('trader not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})

	describe('approve exit trader admin direct', () => {

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
				await wallet.fundEther(trader1, 1, {from: investor1, value: amount})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('ether profit success', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.681) // 0.6 + 0.08 + 0.001

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
					
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.679).toString(), 'amount is correct') // amount minus fee
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.002).toString(), 'amount is correct') // investor fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether breakeven success', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0.6)

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.6).toString(), 'amount is correct') // amount
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether loss success', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.501) // value plus traderfee on loss

					await wallet.disburseEther(trader1, investmentId, value, {from: trader1, value: settlementAmount})
					result = await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.5).toString(), 'amount is correct') // value
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(ETHER, 'token is correct')
					event.amount.toString().should.eq(ether(0.001).toString(), 'amount is correct') // fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('ether profit failure', () => {

				beforeEach(async () => {
					value = ether(0.7)
					settlementAmount = ether(0.681) // 0.6 + 0.08 + 0.001

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.07)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('ether breakeven failure', () => {

				beforeEach(async () => {
					value = ether(0.6)
					settlementAmount = ether(0.6)

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.01)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('ether loss failure', () => {

				beforeEach(async () => {
					value = ether(0.5)
					settlementAmount = ether(0.501)

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
					await wallet2.fundEther(trader2, 1, {from: investor2, value: amount})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementEther(trader1, 1, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = ether(0.0001)
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount, value: settlementAmount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount})
					await wallet.approveDisbursementEther(trader1, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
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
				await wallet.fundToken(trader1, token.address, amount, 1, {from: investor1})
				await wallet.stop(trader1, investmentId, {from: investor1})
			})

			describe('token profit success', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.681) // 0.6 + 0.08 + 0.001

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits Payout events', async () => {
					// console.log("Logs", result.logs)
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.679).toString(), 'amount is correct') // amount minus fee
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.002).toString(), 'amount is correct') // investor fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					// console.log("Logs", result.logs)
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token breakeven success', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0.6)

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits a Payout event', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.6).toString(), 'amount is correct') // amount
					event.to.toString().should.eq(investor1.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[1]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token loss success', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.501) // traderfee on loss

					await token.approve(wallet.address, settlementAmount, {from: trader1})
					await wallet.disburseToken(trader1, investmentId, token.address, value, settlementAmount, {from: trader1})
					result = await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
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
					investmentObj.state.toString().should.eq('4', 'investment state correct')
				})

				it('emits Payout events', async () => {
					let log = result.logs[0]
					log.event.should.eq('Payout')
					let event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.5).toString(), 'amount is correct') // value
					event.to.toString().should.eq(investor1.toString(), 'to is correct')

					log = result.logs[1]
					log.event.should.eq('Payout')
					event = log.args
					event.token.should.eq(token.address, 'token is correct')
					event.amount.toString().should.eq(tokens(0.001).toString(), 'amount is correct') // fee
					event.to.toString().should.eq(feeAccount.toString(), 'to is correct')
				})

				it('emits an DisbursementCompleted event', async () => {
					const log = result.logs[2]
					log.event.should.eq('DisbursementCompleted')
					const event = log.args
					event.initiator.toString().should.eq(trader1, 'initiator is correct')
					event.signedBy.toString().should.eq(feeAccount, 'signedBy is correct')
					event.investmentId.toString().should.eq(investmentId.toString(), 'investmentId is correct')
					event.disbursementId.toString().should.eq('0', 'disbursementId is correct')
				})
			})

			describe('token profit failure', () => {

				beforeEach(async () => {
					value = tokens(0.7)
					settlementAmount = tokens(0.681) // 0.6 + 0.08 + 0.001

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.07)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('token breakeven failure', () => {

				beforeEach(async () => {
					value = tokens(0.6)
					settlementAmount = tokens(0.6)

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.01)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})

			describe('token loss failure', () => {

				beforeEach(async () => {
					value = tokens(0.5)
					settlementAmount = tokens(0.501)

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
					await wallet2.fundToken(trader2, token.address, amount, 1, {from: investor2})
					await wallet2.stop(trader2, 2, {from: investor2})
				})

				it('wrong disbursement', async () => {
					await wallet.approveDisbursementToken(trader1, 1, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('wrong settlementAmount', async () => {
					settlementAmount = tokens(0.0001)
					await token.approve(wallet.address, settlementAmount, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, settlementAmount, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})

				it('admin not found', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: dummy}).should.be.rejectedWith(EVM_REVERT)
				})

				it('already disbursed', async () => {
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount})
					await wallet.approveDisbursementToken(trader1, 0, token.address, 0, {from: feeAccount}).should.be.rejectedWith(EVM_REVERT)
				})
			})
		})
	})
})