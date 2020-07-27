import BigNumber from 'bignumber.js'
const uuid = require("uuid")

const web3 = require("web3");
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const GREEN = 'success'
export const RED = 'danger'
export const NEUTRAL = 'info'

const tokens = [
    { symbol: 'ETH', decimals: 18, address: ZERO_ADDRESS },
    { symbol: 'WETH', decimals: 18, address: ZERO_ADDRESS },
    { symbol: 'DAI', decimals: 18, address: `${process.env.REACT_APP_DAI_ADDRESS}` },
    { symbol: 'SAI', decimals: 18, address: `${process.env.REACT_APP_SAI_ADDRESS}` },
    { symbol: 'USDC', decimals: 6, address: `${process.env.REACT_APP_USDC_ADDRESS}` }
]

export const log = (...logs) => {
	if (process.env.NODE_ENV === 'development') {
		console.log(logs)
	}
}

export const tokenAddressForSymbol = (symbol) => {
	let token = tokens.find(token => token.symbol === symbol)
	return token ? token.address : null
}

export const tokenSymbolForAddress = (address) => {
	let token = tokens.find(token => token.address === address)
	return token ? token.symbol : null
}

export const tokenDecimalsForSymbol = (symbol) => {
	let token = tokens.find(token => token.symbol === symbol)
	return token ? token.decimals : 18
}

export const tokenDecimalsForAddress = (address) => {
	let token = tokens.find(token => token.address === address)
	return token ? token.decimals : 18
}

export const toBN = (weiNumber) => {
	// We always work with BigNumber in wei, and decimals in wei are superfluous
	return weiNumber.toString().split('.')[0]
}

export const weiToEther = (wei, decimals) => {
	if (wei) {
		return wei.dividedBy(new BigNumber(10).exponentiatedBy(decimals))
	}
}

export const etherToWei = (e, decimals) => {
	if (e) {
		e = new BigNumber(e)
		return e.times(new BigNumber(10).exponentiatedBy(decimals))
	}
}

export const formatBalance = (balance, asset) => {
	const precision = 10000
	balance = weiToEther(balance, tokenDecimalsForSymbol(asset))
	// console.log('balance', balance.toString())
	const formatted = Math.round(balance.times(precision).toNumber()) / precision
	return formatted
}

export const getTokenSymbol = (address) => {
	switch(address) {
		case `${process.env.REACT_APP_DAI_ADDRESS}`:
			return 'DAI'
		case `${process.env.REACT_APP_USDC_ADDRESS}`:
			return 'USDC'
		default:
			return 'ETH'
	}
}

export const notification = (title, message, hash) => {
	return {
		id: uuid.v4(),
		title: title,
		message: message,
		hash: hash
	}
}
