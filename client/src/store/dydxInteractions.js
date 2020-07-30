import axios from 'axios'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import {
	positionsCountLoaded,
	traderPositionLoaded,
	traderRatingsLoaded
} from './dydxActions.js'
import { log, etherToWei } from '../helpers'

export const loadPositionsCount = async (account, dispatch) => {
	try {
		let url = `${process.env.REACT_APP_DYDX_CLOSED_URL}`
		axios.get(url.replace('$1', account))
		  .then(function (response) {
		    // handle success
		    dispatch(positionsCountLoaded(response.data.positions.length))
		  })
		  .catch(function (error) {
		    // handle error
		    log(error)
		  })
	} catch (error) {
		log('Could not get positions', error)
		return null
	}
}

export const loadTraderRatings = async (account, allTraders, dispatch) => {

	let allLow = {
		WETH: null,
		DAI: null,
		USDC: null
	}
	let allHigh = {
		WETH: null,
		DAI: null,
		USDC: null
	}

	let accountAvg = {
		WETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountTotal = {
		WETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}
	let accountCnt = {
		WETH: 0,
		DAI: 0,
		USDC: 0
	}

	let ratings = {
		WETH: new BigNumber(0),
		DAI: new BigNumber(0),
		USDC: new BigNumber(0)
	}

	let assets = ["WETH", "DAI", "USDC"]

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {
		let trader = allTraders[traderIndex]


		let traderAvg = {
			WETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderTotal = {
			WETH: new BigNumber(0),
			DAI: new BigNumber(0),
			USDC: new BigNumber(0)
		}
		let traderCnt = {
			WETH: 0,
			DAI: 0,
			USDC: 0
		}

		let positions = await getTraderPositions(trader.user)

		for (let positionIndex=0; positionIndex<positions.length; positionIndex++) {
			let position = positions[positionIndex]

			traderTotal[position.asset] = traderTotal[position.asset].plus(position.nettProfit)
			traderCnt[position.asset] = traderCnt[position.asset] + 1
			// traderAvg[position.asset] = traderTotal[position.asset].dividedBy(traderCnt[position.asset])

			if (trader.user === account) {
				accountTotal[position.asset] = traderTotal[position.asset]
				accountCnt[position.asset] = traderCnt[position.asset]
			}
			
			if (positionIndex === (positions.length - 1)) {

				assets.forEach((asset, assetIndex) => {
					
					// done with trader
					if (traderCnt[asset] > 0) {
						traderAvg[asset] = traderTotal[asset].dividedBy(traderCnt[asset])
					}

					if (allLow[asset] === null || traderAvg[asset].isLessThan(allLow[asset])) {
						allLow[asset] = traderAvg[asset]
					}

					if (allHigh[asset] === null || traderAvg[asset].isGreaterThanOrEqualTo(allHigh[asset])) {
						allHigh[asset] = traderAvg[asset]
					}
				})

				if (traderIndex === (allTraders.length - 1)) {
					// done with all
					assets.forEach((asset, assetIndex) => {
						

						if (accountCnt[asset] > 0) {
							accountAvg[asset] = accountTotal[asset].dividedBy(accountCnt[asset])
						}

						if (allLow[asset] === null) {
							allLow[asset] = new BigNumber(0)
						}
						if (allHigh[asset] === null) {
							allHigh[asset] = new BigNumber(0)
						}

						if (accountCnt[asset] === 0) {
							ratings[asset] = new BigNumber(0)
						} else {
							if (allHigh[asset].isEqualTo(allLow[asset])) {
								ratings[asset] = new BigNumber(10)
							} else {
								ratings[asset] = ((accountAvg[asset].minus(allLow[asset])).dividedBy(allHigh[asset].minus(allLow[asset]))).multipliedBy(10)
							}
						}
					})

					dispatch(traderRatingsLoaded(account, ratings))
				}
			}
		}
	}
}

export const loadTraderPositions = async (account, dispatch) => {
	try {
		let positions = await getTraderPositions(account)

		positions.forEach((position, index) => dispatch(traderPositionLoaded(position)))

	} catch (error) {
		log('Could not get trader positions', error)
		return null
	}
}

export const getTraderPositions = async (account) => {
	try {
		let positions = await getTraderAndMarketPositions(account, 'WETH-DAI')
		let p = await getTraderAndMarketPositions(account, 'WETH-USDC')
		if (p.length > 0) {
			positions = positions.concat(p)
		}
		p = await getTraderAndMarketPositions(account, 'DAI-USDC')
		if (p.length > 0) {
			positions = positions.concat(p)
		}
		return positions
	} catch (error) {
		log('Could not get trader positions', error)
	}
	return []
}

const getTraderAndMarketPositions = async (account, market) => {
	try {
		let url = `${process.env.REACT_APP_DYDX_CLOSED_MARKET_URL}`
		let response = await axios.get(url.replace('$1', market).replace('$2', account))
		
	    // handle success
	    // log('Response', response)
	    if (response.data.positions.length > 0) {
	    	const mappedPositions = mapTraderPositions(response.data.positions)
	    	return mappedPositions
		}
	  
	} catch(error) {
	    // handle error
	    log(error)
	    
	}
	return []
}

const mapTraderPositions = (positions) => {
	const mappedPositions = positions.map((position) => {
		position = mapTraderPosition(position)
		return position
	})

	return mappedPositions
}

const mapTraderPosition = (position) => {
	const mappedStandardActions = mapStandardActions(position.standardActions)
	
	const fee = mappedStandardActions.reduce((total, action) => {
		return total.plus(action.convertedFeeAmount)
	}, new BigNumber(0))

	const transfers = mappedStandardActions.filter(action => action.transferAmount)
	if (transfers.length > 1) {

		let profit = transfers[0].transferAmount.minus(transfers[transfers.length - 1].transferAmount)
		
		const mappedPosition = {
			uuid: position.uuid,
			owner: position.owner,
			type: position.type,
			status: position.status,
			asset: mappedStandardActions[0].asset,
			market: position.market,
			start: moment(transfers[transfers.length - 1].confirmedAt),
			end: moment(transfers[0].confirmedAt),
			profit: profit,
			fee: fee,
			nettProfit: profit.minus(fee),
			standardActions: mappedStandardActions
		}

		return mappedPosition
	}

	return null
}

const mapStandardActions = (standardActions) => {
	const mappedStandardActions = standardActions.map((standardAction) => {
		standardAction = mapStandardAction(standardAction)
		return standardAction
	})

	return mappedStandardActions
}

const mapStandardAction = (standardAction) => {
	const transferAmount = standardAction.transferAmount ? new BigNumber(standardAction.transferAmount) : null
	const price = standardAction.price ? new BigNumber(standardAction.price) : null
	const feeAmount = standardAction.feeAmount ? new BigNumber(standardAction.feeAmount) : null
	const feeAsset = standardAction.feeAsset
	let convertedFeeAmount = feeAmount
	// let ethTransferAmount = transferAmount.toString()

	// if (standardAction.asset === 'DAI') {
	// 	ethTransferAmount = etherToWei(transferAmount.dividedBy(price.times(new BigNumber(10).exponentiatedBy(18)))).toString()
	// }

	if (feeAsset) {
		if(standardAction.asset !== standardAction.feeAsset) {
			convertedFeeAmount = feeAmount.dividedBy(price)
		}
	} else {
		convertedFeeAmount = new BigNumber(0)
	}

	const mappedStandardAction = {
		uuid: standardAction.uuid,
		type: standardAction.type,
		transferAmount: transferAmount,
		// ethTransferAmount: ethTransferAmount,
		tradeAmount: new BigNumber(standardAction.tradeAmount),
		price: price,
		asset: standardAction.asset,
		side: standardAction.side,
		transactionHash: standardAction.transactionHash,
		confirmedAt: moment(standardAction.confirmedAt),
		feeAmount: feeAmount,
		feeAsset: feeAsset,
		convertedFeeAmount: convertedFeeAmount
	}

	return mappedStandardAction
}