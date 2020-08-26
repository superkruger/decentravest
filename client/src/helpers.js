import BigNumber from 'bignumber.js'
const uuid = require("uuid")

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
export const INVESTMENT_COLLATERAL = 0
export const INVESTMENT_DIRECT = 1

export const GREEN = 'success'
export const RED = 'danger'
export const NEUTRAL = 'info'

export let userTokens = []
let tokens = []

export const setTokens = (network) => {
	userTokens = [
		{ symbol: 'ETH', decimals: 18, address: ZERO_ADDRESS },
	    { symbol: 'DAI', decimals: 18, address: process.env['REACT_APP_'+network+'_DAI_ADDRESS'] },
	    { symbol: 'USDC', decimals: 6, address: process.env['REACT_APP_'+network+'_USDC_ADDRESS'] }
	]

	tokens = [
	    ...userTokens,
	    { symbol: 'WETH', decimals: 18, address: ZERO_ADDRESS },
	    { symbol: 'SAI', decimals: 18, address: process.env['REACT_APP_'+network+'_SAI_ADDRESS'] }
	]
}

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

export const info = (title, message, hash) => {
	let id
	if (hash) {
		id = hash
	} else {
		id = uuid.v4()
	}
	return {
		id: id,
		variant: 'info',
		title: title,
		message: message,
		hash: hash
	}
}

export const fail = (title, message) => {
	return {
		id: uuid.v4(),
		variant: 'danger',
		title: title,
		message: message
	}
}

export const uniqueByKey = (data, key) => {
	return [
		... new Map(
				data.map(x => [key(x), x])
			).values()
	]
}
