import axios from 'axios'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import {
	positionsCountLoaded,
	traderPositionLoaded
} from './dydxActions.js'
import { log, etherToWei } from '../helpers'

export const loadPositionsCount = async (network, account, dispatch) => {
	try {
		let url = process.env['REACT_APP_' + network + '_DYDX_CLOSED_URL']
		log('loadPositionsCount', network, url)
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

export const loadTraderPositions = async (network, account, dispatch) => {
	try {
		let positions = await getTraderPositions(network, account)

		positions.forEach((position, index) => dispatch(traderPositionLoaded(position)))

	} catch (error) {
		log('Could not get trader positions', error)
		return null
	}
}

export const getTraderPositions = async (network, account) => {
	try {
		let positions = await getTraderAndMarketPositions(network, account, 'WETH-DAI')
		let p = await getTraderAndMarketPositions(network, account, 'WETH-USDC')
		if (p.length > 0) {
			positions = positions.concat(p)
		}
		p = await getTraderAndMarketPositions(network, account, 'DAI-USDC')
		if (p.length > 0) {
			positions = positions.concat(p)
		}
		return positions
	} catch (error) {
		log('Could not get trader positions', error)
	}
	return []
}

const getTraderAndMarketPositions = async (network, account, market) => {
	try {
		let url = process.env['REACT_APP_'+network+'_DYDX_CLOSED_MARKET_URL']
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
			initialAmount: transfers[transfers.length - 1].transferAmount,
			profit: profit,
			fee: fee,
			nettProfit: profit,//.minus(fee),
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