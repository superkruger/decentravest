'use strict';

const axios = require('axios');
const BigNumber = require('bignumber.js');
const moment = require('moment');

const positionsDao = require('../dao/positions');

module.exports.addPosition = async (position) => {
	let id = await positionsDao.create(position);
	if (id === null) {
		return null
	}
	return id;
}

module.exports.getPosition = async (uuid) => {
    let position = await positionsDao.get(uuid);

	return position;
}

module.exports.loadTraderPositions = async (account) => {
	try {
		let positions = await getTraderPositions(account)

		positions.forEach(async (position, index) => {
  			await addPosition(position);
		})

	} catch (error) {
		console.log('Could not load trader positions', error)
		return null
	}
}

module.exports.getTraderPositionsFromTable = async (account) => {
  
  console.log("getTraderPositionsFromTable-", account);

  let result = await positionsDao.getByOwner(account);

  console.log("getTraderPositionsFromTable", result);

  return mapPositions(result);
};

const getTraderPositions = async (account) => {
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
		console.log('Could not get trader positions', error)
	}
	return []
}

const getTraderAndMarketPositions = async (account, market) => {
	try {

		let url = process.env.DYDX_CLOSED_MARKET_URL
		console.log("getTraderAndMarketPositions", url)
		let response = await axios.get(url.replace('$1', market).replace('$2', '0x6b98d58200439399218157B4A3246DA971039460'))
		
	    // handle success
	    if (response.data.positions.length > 0) {
	    	return response.data.positions
		}
	  
	} catch(error) {
	    // handle error
	    console.log(error)
	}
	return []
}

const mapPositions = (positions) => {
	
	const mappedPositions = positions.map((position) => {
		position = mapPosition(position.data)
		return position
	})

	return mappedPositions
}

const mapPosition = (position) => {
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