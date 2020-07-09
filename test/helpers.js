export const EVM_REVERT = 'VM Exception while processing transaction: revert'
export const ETHER = '0x0000000000000000000000000000000000000000'

const BigNumber = require('bignumber.js')
const web3 = require("web3");
const web3Abi = require("web3-eth-abi")

export const ether = (n) => {
	return new web3.utils.BN(
		web3.utils.toWei(n.toString(), 'ether')
	)
}

export const tokens = (n) => ether(n)

export const fromEther = (n) => {
	return web3.fromWei(n, "ether")
}

export const fromTokens = (n) => fromEther(n)

export const add = (a, b) => {
	let bnA = new BigNumber(a)
	let bnB = new BigNumber(b)

	return (bnA.plus(bnB)).toString()
}

export const subtract = (a, b) => {
	let bnA = new BigNumber(a)
	let bnB = new BigNumber(b)

	return (bnA.minus(bnB)).toString()
}

export const wait = ms => new Promise(resolve => setTimeout(resolve, ms))

export const encodeERC20TransferCall = (to, amount) => {
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