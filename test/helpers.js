export const EVM_REVERT = 'VM Exception while processing transaction: revert'
export const ETHER = '0x0000000000000000000000000000000000000000'

const BigNumber = require('bignumber.js')
const web3 = require("web3");

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

export const addEther = (a, b) => {
	let bnA = new BigNumber(a)
	let bnB = new BigNumber(b)

	return (bnA.plus(bnB)).toString()
}

export const addTokens = (a, b) => addEther(a, b)