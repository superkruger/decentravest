'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')

const tradesMysql = require('../mysql/trades')
const helpers = require('../helpers')

module.exports.getTrades = async (account) => {
  const trades = await tradesMysql.getByTrader(account)
  return trades.map(mapTrade)
}

const mapTrade = (trade) => {
  return {
    ...trade,
    start: moment.unix(trade.start),
    end: moment.unix(trade.end),
    profit: new BigNumber(trade.profit),
    initialAmount: new BigNumber(trade.initialAmount)
  }
}
