import axios from 'axios'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import {
	positionsCountLoaded,
	traderPositionsLoaded,
	traderPositionLoaded
} from './dydxActions.js'
import { etherToWei } from '../helpers'

export const loadPositionsCount = async (account, dispatch) => {
	try {
		axios.get('https://api.dydx.exchange/v1/positions?status=CLOSED&owner=0x6b98d58200439399218157B4A3246DA971039460')// + account)
		  .then(function (response) {
		    // handle success
		    dispatch(positionsCountLoaded(response.data.positions.length))
		  })
		  .catch(function (error) {
		    // handle error
		    console.log(error)
		  })
	} catch (error) {
		console.log('Could not get positions', error)
		return null
	}
}

export const loadTraderRating = async (account, allTraders, dispatch) => {

	let allEthLow = null
	let allEthHigh = null

	let accountEthAvg = new BigNumber(0)
	let accountEthTotal = new BigNumber(0)
	let accountEthCnt = 0

	for (let traderIndex=0; traderIndex<allTraders.length; traderIndex++) {
		let trader = allTraders[traderIndex]


		let traderEthAvg = new BigNumber(0)
		let traderEthTotal = new BigNumber(0)
		let traderEthCnt = 0

		let positions = await getTraderPositions(trader)

		for (let positionIndex=0; positionIndex<positions.length; positionIndex++) {
			let position = positions[positionIndex]

			if (position.asset === "WETH") {

				traderEthTotal = traderEthTotal.plus(position.nettProfit)
				traderEthCnt = traderEthCnt + 1

				if (trader === account) {
					accountEthTotal = traderEthTotal
					accountEthCnt = traderEthCnt
				}
			}

			if (positionIndex === (positions.length - 1)) {

				// done with trader
				if (traderEthCnt > 0) {
					traderEthAvg = traderEthTotal.dividedBy(traderEthCnt)
				}

				if (allEthLow === null || traderEthAvg.isLessThan(allEthLow)) {
					allEthLow = traderEthAvg
				}

				if (allEthHigh === null || traderEthAvg.isGreaterThan(allEthHigh)) {
					allEthHigh = traderEthAvg
				}

				if (traderIndex === (allTraders.length - 1)) {
					// done with all
					if (accountEthCnt > 0) {
						accountEthAvg = accountEthTotal.dividedBy(accountEthCnt)
					}

					let ethRating
					if (allEthHigh.isEqualTo(allEthLow)) {
						if (accountEthAvg.isEqualTo(new BigNumber(0))) {
							ethRating = new BigNumber(0)
						} else {
							ethRating = new BigNumber(10)
						}
					} else {
						ethRating = ((accountEthAvg.minus(allEthLow)).dividedBy(allEthHigh.minus(allEthLow))).multipliedBy(10)
					}
					console.log('ETH Rating', ethRating.toString())
				}
			}
		}
	}
}

export const loadTraderPositions = async (account, dispatch) => {
	try {
		let positions = await getTraderPositions(account)
		positions.forEach((position, index) => dispatch(traderPositionLoaded(position)))

		// dispatch(traderPositionsLoaded())
	} catch (error) {
		console.log('Could not get trader positions', error)
		return null
	}
}

const getTraderPositions = async (account) => {
	try {
		let positions = await getTraderAndMarketPositions(account, 'WETH-DAI')
		
		let p = await getTraderAndMarketPositions(account, 'WETH-USDC')
		if (p.length > 0) {
			positions.push(p)
		}
		p = await getTraderAndMarketPositions(account, 'DAI-USDC')
		if (p.length > 0) {
			positions.push(p)
		}
		return positions
	} catch (error) {
		console.log('Could not get trader positions', error)
	}
	return []
}

const getTraderAndMarketPositions = async (account, market) => {
	try {

		let response = await axios.get('https://api.dydx.exchange/v1/positions?status=CLOSED&market=' + market + '&owner=' + account)
		
	    // handle success
	    // console.log('Response', response)
	    if (response.data.positions.length > 0) {
	    	const mappedPositions = mapTraderPositions(response.data.positions)
	    	return mappedPositions
	    	//dispatch(traderPositionsLoaded())

	    	// console.log(mappedPositions)
		}
	  
	} catch(error) {
	    // handle error
	    console.log(error)
	    
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

	let profit = new BigNumber(0)
	const transfers = mappedStandardActions.filter(action => action.transferAmount)
	if (transfers.length > 1) {
		profit = transfers[0].transferAmount.minus(transfers[transfers.length - 1].transferAmount)
	}

	const mappedPosition = ({
		uuid: position.uuid,
		type: position.type,
		status: position.status,
		asset: mappedStandardActions[0].asset,
		market: position.market,
		createdAt: moment(position.createdAt),
		profit: profit,
		fee: fee,
		nettProfit: profit.minus(fee),
		standardActions: mappedStandardActions
	})

	// dispatch(traderPositionLoaded(mappedPosition))

	return mappedPosition
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

	const mappedStandardAction = ({
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
	})

	return mappedStandardAction
}