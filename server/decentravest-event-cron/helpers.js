const BigNumber = require('bignumber.js')
const uuid = require("uuid")

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
module.exports.ZERO_ADDRESS = ZERO_ADDRESS
const INVESTMENT_COLLATERAL = 0
module.exports.INVESTMENT_COLLATERAL = INVESTMENT_COLLATERAL
const INVESTMENT_DIRECT = 1
module.exports.INVESTMENT_DIRECT = INVESTMENT_DIRECT

module.exports.INVESTMENT_STATE_INVESTED = 0
module.exports.INVESTMENT_STATE_STOPPED = 1
module.exports.INVESTMENT_STATE_EXITREQUESTED_INVESTOR = 2
module.exports.INVESTMENT_STATE_EXITREQUESTED_TRADER = 3
module.exports.INVESTMENT_STATE_EXITAPPROVED = 4

const userTokens = [
		{ symbol: 'ETH', decimals: 18, address: ZERO_ADDRESS },
	    { symbol: 'DAI', decimals: 18, address: process.env.DAI_ADDRESS },
	    { symbol: 'USDC', decimals: 6, address: process.env.USDC_ADDRESS }
	]
module.exports.userTokens = userTokens

const tokens = [
	    ...userTokens,
	    { symbol: 'WETH', decimals: 18, address: ZERO_ADDRESS },
	    { symbol: 'SAI', decimals: 18, address: process.env.SAI_ADDRESS }
	]
module.exports.tokens = tokens

const tokenAddressForSymbol = (symbol) => {
	let token = tokens.find(token => token.symbol === symbol)
	return token ? token.address : null
}
module.exports.tokenAddressForSymbol = tokenAddressForSymbol

const tokenSymbolForAddress = (address) => {
	let token = tokens.find(token => token.address === address)
	return token ? token.symbol : null
}
module.exports.tokenSymbolForAddress = tokenSymbolForAddress

const tokenDecimalsForSymbol = (symbol) => {
	let token = tokens.find(token => token.symbol === symbol)
	return token ? token.decimals : 18
}
module.exports.tokenDecimalsForSymbol = tokenDecimalsForSymbol

const tokenDecimalsForAddress = (address) => {
	let token = tokens.find(token => token.address === address)
	return token ? token.decimals : 18
}
module.exports.tokenDecimalsForAddress = tokenDecimalsForAddress

const toBN = (weiNumber) => {
	// We always work with BigNumber in wei, and decimals in wei are superfluous
	return weiNumber.toString().split('.')[0]
}
module.exports.toBN = toBN

const weiToEther = (wei, decimals) => {
	if (wei) {
		return wei.dividedBy(new BigNumber(10).exponentiatedBy(decimals))
	}
}
module.exports.weiToEther = weiToEther

const etherToWei = (e, decimals) => {
	if (e) {
		e = new BigNumber(e)
		return e.times(new BigNumber(10).exponentiatedBy(decimals))
	}
}
module.exports.etherToWei = etherToWei

const formatBalance = (balance, asset) => {
	const precision = 10000
	balance = weiToEther(balance, tokenDecimalsForSymbol(asset))
	// console.log('balance', balance.toString())
	const formatted = Math.round(balance.times(precision).toNumber()) / precision
	return formatted
}
module.exports.formatBalance = formatBalance

const uniqueByKey = (data, key) => {
	return [
		... new Map(
				data.map(x => [key(x), x])
			).values()
	]
}
module.exports.uniqueByKey = uniqueByKey
