'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')

const tradesDao = require('../dao/trades')
const helpers = require('../helpers')

module.exports.getTrades = async (account) => {
  
  const trades = await tradesDao.getTrades(account)
  return trades.map(mapTrade)
}


const mapTrade = (trade) => {
  return {
    ...trade,
    start: moment(trade.start),
    end: moment(trade.end),
    profit: new BigNumber(trade.profit),
    initialAmount: new BigNumber(trade.initialAmount)
  }
}
