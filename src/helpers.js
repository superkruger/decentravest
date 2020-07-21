import BigNumber from 'bignumber.js'
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export const GREEN = 'success'
export const RED = 'danger'
export const NEUTRAL = 'info'

const assets = {
    'ETH': { decimals: 18, address: '0x0000000000000000000000000000000000000000' },
    'WETH': { decimals: 18, address: '0x0000000000000000000000000000000000000000' },
    'DAI': { decimals: 18, address: `${process.env.REACT_APP_DAI_ADDRESS}` },
    'SAI': { decimals: 18, address: `${process.env.REACT_APP_SAI_ADDRESS}` },
    'USDC': { decimals: 6, address: `${process.env.REACT_APP_USDC_ADDRESS}` }
}

export const addressForAsset = (asset) => {
	return assets[asset] ? assets[asset].address : null
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
	balance = weiToEther(balance, assets[asset].decimals)
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