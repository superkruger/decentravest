import BigNumber from 'bignumber.js'

export const GREEN = 'success'
export const RED = 'danger'
export const NEUTRAL = 'info'

const assetDecimals = {
    'ETH': 18,
    'WETH': 18,
    'DAI': 18,
    'SAI': 18,
    'USDC': 6
};

export const weiToEther = (wei, decimals) => {
	if (wei) {
		return wei.dividedBy(new BigNumber(10).exponentiatedBy(decimals))
	}
}

// export const etherToWei = (e, decimals) => {
// 	if (e) {
// 		e = new BigNumber(e)
// 		return e.times(new BigNumber(10).exponentiatedBy(decimals))
// 	}
// }

export const formatBalance = (balance, asset) => {
	const precision = 100
	balance = weiToEther(balance, assetDecimals[asset])
	console.log('balance', balance.toString())
	const formatted = Math.round(balance.times(precision).toNumber()) / precision
	return formatted
}
