'use strict';

const axios = require('axios')
const BigNumber = require('bignumber.js')
const moment = require('moment')
const path = require("path")
const fs = require('fs')
const _ = require('lodash')

const dmexDao = require('../dao/exchange/dmex')
const tradesMysql = require('../mysql/trades')

const EXCHANGE = 2

const addPosition = async (position) => {
	if (!position) {
		return null
	}
	let id = await dmexDao.create(position);
	if (id === null) {
		return null
	}
	return id;
}
module.exports.addPosition = addPosition

module.exports.getPosition = async (uuid) => {
    let position = await dmexDao.get(uuid);

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
		positions = positions.filter(position => parseInt(moment(position.closed_at).unix(), 10) > lastDate)

		for (let i=0; i<positions.length; i++) {
			let position = positions[i]
			console.log("Position", position)

			const asset = _.get(position, 'futures_asset.base_token.symbol', null)

			if (asset !== 'ETH' && asset !== 'DAI') {
				console.log(`Position asset ${asset} not supported`)
				continue
			}

			let result = await dmexDao.create(position)
			if (!result) {
				return false
			}

			result = await dmexDao.get(position.position_hash)
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
	let data = []
	try {

		let url = process.env.DMEX_CLOSED_POSITION_URL
		url = url.replace('$1', account)

		if (process.env.STAGE === 'dev') {
			if (process.env.LAMBDA_TASK_ROOT) {
				url = path.resolve(process.env.LAMBDA_TASK_ROOT, url)
			} else {
				url = path.resolve(__dirname, '../'+url)
			}

			const response = JSON.parse(fs.readFileSync(url, 'utf8'));
			return response.data
		} else {
			console.log("getTraderPositions", url)
			const response = await axios.get(url)

			data = _.get(response, "data.data", [])
		}
		
	} catch(error) {
	    // handle error
	    console.log(error)
	}
	return data
}

const decoratePosition = (position) => {
	const asset = _.get(position, 'futures_asset.base_token.symbol', null)
	if (asset) {

		const pnl = new BigNumber(position.pnl + assetPadding(asset))
		const funding_cost = new BigNumber(position.funding_cost + assetPadding(asset))

		const profit = pnl.minus(funding_cost)
		
		const mappedPosition = {
			...position,
			dv_profit: profit.toString(),
			dv_asset: asset
		}

		return mappedPosition
	}

	return null
}

const positionToTrade = (position) => {
	return {
		id: position.position_hash,
		trader: position.user_address,
		start: parseInt(moment(position.created_at).unix(), 10),
		end: parseInt(moment(position.closed_at).unix(), 10),
		asset: position.dv_asset,
		profit: position.dv_profit,
		initialAmount: position.max_collateral + assetPadding(position.dv_asset),
		exchange: EXCHANGE
	}
}

const assetPadding = (asset) => {
	switch (asset) {
		case 'ETH':
			return '0000000000'
		case 'DAI':
			return '0000000000'
	}
	return ''
}
