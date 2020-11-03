'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')

const encode = require('../common/encode');
const investmentsDao = require('../dao/investments')

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
    investment.traderLimit = totalInvested
  }

  let result = await investmentsDao.create(investment)

  return result
}

module.exports.get = async (investmentId) => {
  let investment = await investmentsDao.get(investmentId)

  if (investment) {
    return decorateInvestment(investment)
  }

  return null
}

module.exports.update = async (investment) => {

  investment = reduceInvestment(investment)

  let result = await investmentsDao.update(investment)

  return result
};

module.exports.getByTraderAndToken = async (trader, token) => {

  const result = await investmentsDao.getByTraderAndToken(trader, token)
  return result.map(decorateInvestment)
}

module.exports.getByTraderUpTo = async (trader, startDate) => {

  const result = await investmentsDao.getByTraderUpTo(trader, startDate)
  return result.map(decorateInvestment)
}

const mapInvestEvent = (event) => {

  return {
    investBlockNumber: event.blockNumber,
    stopBlockNumber: 0,
    requestBlockNumber: 0,
    rejectBlockNumber: 0,
    approveBlockNumber: 0,
    id: event.returnValues.id,
    disbursementId: 0,
    wallet: event.returnValues.wallet,
    trader: event.returnValues.trader,
    investor: event.returnValues.investor,
    token: event.returnValues.token,
    amount: event.returnValues.amount,
    value: event.returnValues.amount,
    investorProfitPercent: event.returnValues.investorProfitPercent,
    investmentType: parseInt(event.returnValues.investmentType, 10),
    state: 0,
    traderLimit: event.returnValues.allocationTotal,
    startDate: parseInt(event.returnValues.date, 10),
    endDate: 0,
    grossValue: event.returnValues.amount,
    nettValue: event.returnValues.amount
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
    investorProfitPercent: investment.investorProfitPercent.toString(),
    traderLimit: investment.traderLimit.toString(),
    startDate: investment.startDate.unix(),
    endDate: investment.endDate.unix(),
    grossValue: investment.grossValue.toString(),
    nettValue: investment.nettValue.toString()
  }
}
