'use strict';

const axios = require('axios')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const path = require("path")
const fs = require('fs')

const dydxDao = require('../dao/exchange/dydx')
const tradesMysql = require('../mysql/trades')

const EXCHANGE = 1

const addPosition = async (position) => {
	if (!position) {
		return null
	}
	let id = await dydxDao.create(position);
	if (id === null) {
		return null
	}
	return id;
}
module.exports.addPosition = addPosition

module.exports.getPosition = async (uuid) => {
    let position = await dydxDao.get(uuid);

	return position;
}

module.exports.loadTraderPositions = async (account) => {
	try {
		console.log("loadTraderPositions", account)

		let lastDate
		let last = await tradesMysql.getLastForTraderAndExchange(account, EXCHANGE)
		if (last) {
			lastDate = last.end
		} else {
			lastDate = 0
		}

		console.log("Last trade", lastDate)

		let positions = await getTraderPositions(account)
		positions = positions.map(decoratePosition)
		// only process new positions
		positions = positions.filter(position => parseInt(moment(position.dv_end).unix(), 10) > lastDate)

		for (let i=0; i<positions.length; i++) {
			console.log("Position", positions[i])

			let result = await dydxDao.create(positions[i])
			if (!result) {
				return false
			}

			result = await dydxDao.get(positions[i].uuid)
			if (!result) {
				return false
			}

			result = await tradesMysql.createOrUpdate(positionToTrade(result))
			console.log('tradesMysql.createOrUpdate', result)
			if (!result) {
				return false
			}
		}

		return true

	} catch (error) {
		console.log('Could not load trader positions', error)
		return false
	}
}

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
		url = url.replace('$1', market).replace('$2', account)
		let response

		if (process.env.STAGE === 'dev') {
			if (process.env.LAMBDA_TASK_ROOT) {
				url = path.resolve(process.env.LAMBDA_TASK_ROOT, url)
			} else {
				url = path.resolve(__dirname, '../'+url)
			}

			const response = JSON.parse(fs.readFileSync(url, 'utf8'));
			return response.positions
		} else {
			console.log("getTraderAndMarketPositions", url)
			const response = await axios.get(url)

			// handle success
		    if (response.data.positions.length > 0) {
		    	return response.data.positions
			}
		}
		
	} catch(error) {
	    // handle error
	    console.log(error)
	}
	return []
}

const decoratePosition = (position) => {
	const transfers = position.standardActions.filter(action => action.transferAmount)
	if (transfers.length > 1) {

		const lastTransfer = new BigNumber(transfers[0].transferAmount)
		const firstTransfer = new BigNumber(transfers[transfers.length - 1].transferAmount)

		const profit = lastTransfer.minus(firstTransfer)
		
		const mappedPosition = {
			...position,
			dv_profit: profit.toString(),
			dv_initialAmount: transfers[transfers.length - 1].transferAmount,
			dv_asset: transfers[0].asset,
			dv_start: transfers[transfers.length - 1].confirmedAt,
			dv_end: transfers[0].confirmedAt
		}

		return mappedPosition
	}

	return null
}

const positionToTrade = (position) => {
	return {
		id: position.uuid,
		trader: position.owner,
		start: parseInt(moment(position.dv_start).unix(), 10),
		end: parseInt(moment(position.dv_end).unix(), 10),
		asset: position.dv_asset === 'WETH' ? 'ETH' : position.dv_asset,
		profit: position.dv_profit,
		initialAmount: position.dv_initialAmount,
		exchange: EXCHANGE
	}
}
