const EVM_REVERT = 'VM Exception while processing transaction: revert'
const ETHER = '0x0000000000000000000000000000000000000000'

const { accounts, contract } = require('@openzeppelin/test-environment');

const MultiSigFundWalletFactory = contract.fromArtifact('MultiSigFundWalletFactory');
const TraderPaired = contract.fromArtifact('TraderPaired');
const PairedInvestments = contract.fromArtifact('PairedInvestments');
const Token = contract.fromArtifact('@openzeppelin/contracts-ethereum-package/StandaloneERC20');

const BigNumber = require('bignumber.js')
const web3 = require("web3");
const web3Abi = require("web3-eth-abi")

const traderFeePercent = 100
const investorFeePercent = 100
const investorCollateralProfitPercent = 2000
const investorDirectProfitPercent = 8000

const deployToken = async () => {
	const [ deployer, feeAccount, trader1, trader2, investor1, investor2, dummy ] = accounts;

	let token = await Token.new()
	await token.initialize("DemoToken", "DTK", 18, tokens(1000000), deployer, [deployer], [deployer])
	// Transfer some tokens to traders and investors
	await token.transfer(trader1, tokens(100), { from: deployer })
	await token.transfer(trader2, tokens(100), { from: deployer })
	await token.transfer(investor1, tokens(100), { from: deployer })
	await token.transfer(investor2, tokens(100), { from: deployer })

	return token
}

const deployFactory = async () => {
	let factory = await MultiSigFundWalletFactory.new()
	await factory.initialize()
	// console.log("MultiSigFundWalletFactory Deployed", factory.constructor._json.bytecode.length)

	return factory
}

const deployInvestments = async () => {
	let investments = await PairedInvestments.new()
	// console.log("PairedInvestments Deployed", investments.constructor._json.bytecode.length)
	await investments.initialize(traderFeePercent, investorFeePercent)

	return investments
}

const deployPlatform = async (token, factory, investments) => {
	const [ deployer, feeAccount, trader1, trader2, investor1, investor2, dummy ] = accounts;

	let platform = await TraderPaired.new()
	// console.log("TraderPaired Deployed", platform.constructor._json.bytecode.length)
	await platform.initialize(feeAccount)
	await platform.setPairedInvestments(investments.address)
	await platform.setMultiSigFundWalletFactory(factory.address)
	await platform.setToken(ETHER, true)
	await platform.setToken(token.address, true)

	await factory.setManager(platform.address)
	await investments.setManager(platform.address)

	console.log('')

	return platform
}

const ether = (n) => {
	return new web3.utils.BN(
		web3.utils.toWei(n.toString(), 'ether')
	)
}

const weiFromGwei = (n) => {
	return new web3.utils.BN(
		web3.utils.toWei(n.toString(), 'gwei')
	)
}

const tokens = (n) => ether(n)

const fromEther = (n) => {
	return web3.fromWei(n, "ether")
}

const fromTokens = (n) => fromEther(n)

const add = (a, b) => {
	let bnA = new BigNumber(a)
	let bnB = new BigNumber(b)

	return (bnA.plus(bnB)).toString()
}

const subtract = (a, b) => {
	let bnA = new BigNumber(a)
	let bnB = new BigNumber(b)

	return (bnA.minus(bnB)).toString()
}

const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

const encodeERC20TransferCall = (to, amount) => {
	let encoded = web3Abi.encodeFunctionCall({
	    name: 'transfer',
	    type: 'function',
	    inputs: [{
	        type: 'address',
	        name: 'to'
	    },{
	        type: 'uint256',
	        name: 'amount'
	    }]
	}, [to, amount]);

	console.log('Encoded', encoded)
	return encoded
}

module.exports = { EVM_REVERT, ETHER, traderFeePercent, investorFeePercent, investorCollateralProfitPercent, investorDirectProfitPercent, deployToken, deployFactory, deployInvestments, deployPlatform, ether, weiFromGwei, tokens, fromEther, fromTokens, add, subtract, wait, encodeERC20TransferCall }

