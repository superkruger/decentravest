'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')

const encode = require('../common/encode');
const investmentsMysql = require('../mysql/investments')

const statisticsController = require('./statistics')
const helpers = require('../helpers')

module.exports.create = async (event) => {

  let investment = mapInvestEvent(event)

  if (investment.investmentType === 1) {
    // get direct limit
    const symbol = helpers.tokenSymbolForAddress(investment.token)

    const totalInvested = await statisticsController.getTotalInvestedForInvestment(investment)

    if (!totalInvested) {
      console.error(`Could not create investment ${investment}. totalInvested not calculated`)
      return false
    }

    // upper limit for calculating value is the total value of investments
    investment.traderLimit = totalInvested.toString()
  }

  let result = await investmentsMysql.createOrUpdate(investment)

  return result
}

module.exports.get = async (investmentId) => {
  let investment = await investmentsMysql.get(investmentId)

  if (investment) {
    return decorateInvestment(investment)
  }

  return null
}

module.exports.listActive = async () => {
  let investments = await investmentsMysql.listActive()

  return investments.map(decorateInvestment)
}

module.exports.update = async (investment) => {

  investment = reduceInvestment(investment)

  let result = await investmentsMysql.update(investment)

  return result
};

module.exports.getByTraderAndToken = async (trader, token) => {

  const result = await investmentsMysql.getByTraderAndToken(trader, token)
  return result.map(decorateInvestment)
}

module.exports.getByTraderUpTo = async (trader, startDate) => {

  const result = await investmentsMysql.getByTraderUpTo(trader, startDate)
  return result.map(decorateInvestment)
}

const mapInvestEvent = (event) => {

  return {
    id: event.investmentId,
    investBlockNumber: event.blockNumber,
    stopBlockNumber: 0,
    requestBlockNumber: 0,
    rejectBlockNumber: 0,
    approveBlockNumber: 0,
    disbursementId: 0,
    wallet: event.wallet,
    trader: event.trader,
    investor: event.investor,
    token: event.token,
    amount: event.amount,
    value: event.amount,
    investorProfitPercent: event.investorProfitPercent,
    investmentType: parseInt(event.investmentType, 10),
    state: 0,
    traderLimit: event.allocationTotal,
    startDate: parseInt(event.eventDate, 10),
    endDate: 0,
    grossValue: event.amount,
    nettValue: event.amount
  }
}

const decorateInvestment = (investment) => {

  return {
    ... investment,
    amount: new BigNumber(investment.amount),
    value: new BigNumber(investment.value),
    investorProfitPercent: new BigNumber(investment.investorProfitPercent),
    traderLimit: new BigNumber(investment.traderLimit),
    startDate: moment.unix(investment.startDate),
    endDate: moment.unix(investment.endDate),
    grossValue: new BigNumber(investment.grossValue),
    nettValue: new BigNumber(investment.nettValue)
  }
}

const reduceInvestment = (investment) => {

  return {
    ... investment,
    amount: investment.amount.toString(),
    value: investment.value.toString(),
    investorProfitPercent: parseInt(investment.investorProfitPercent.toString(), 10),
    traderLimit: investment.traderLimit.toString(),
    startDate: parseInt(investment.startDate.unix(), 10),
    endDate: parseInt(investment.endDate.unix(), 10),
    grossValue: investment.grossValue.toString(),
    nettValue: investment.nettValue.toString()
  }
}
