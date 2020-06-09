import BigNumber from 'bignumber.js'

export const GREEN = 'success'
export const RED = 'danger'
export const NEUTRAL = 'info'

export const weiToEther = (wei) => {
	if (wei) {
		return wei.dividedBy(new BigNumber(10).exponentiatedBy(18))
	}
}

export const etherToWei = (e) => {
	if (e) {
		e = new BigNumber(e)
		return e.times(new BigNumber(10).exponentiatedBy(18))
	}
}

export const formatEtherBalance = (balance) => {
	const precision = 100
	balance = weiToEther(balance)
	console.log('balance', balance.toString())
	const formatted = Math.round(balance.times(precision).toNumber()) / precision
	return formatted
}
