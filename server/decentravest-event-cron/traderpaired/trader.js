'use strict';

const encode = require('../common/encode');
const positions = require('../dydx/positions')
const traderDao = require('../dao/traderpaired/trader')

module.exports.create = async (event) => {

  console.log("trader create", event)
  const id = await traderDao.create(event);
  if (id === null) {
    return null
  }
  
  // add positions
  await positions.loadTraderPositions(event.returnValues.user);

  return id
}

module.exports.get = async (id) => {
  const event = await traderDao.get(id);

  return event;
}

module.exports.list = async () => {
  const events = await traderDao.list();

  return events;
};

module.exports.webList = async () => {
  const events = await traderDao.list();

  return encode.success(events);
};

module.exports.getLast = async () => {
  const event = await traderDao.getLast();

  if (event) {
    console.log("getLast trader", event);
    return event;
  }

  return null;
};

module.exports.calculateTrustRating = async (trader) => {

  let stream = await traderPaired.getPastEvents(
    'Invest', 
    {
      filter: {trader: trader.user},
      fromBlock: 0
    }
  )
  let investments = stream.map((event) => mapInvest(event.returnValues))
  
  log("loadTraderTrustRating - Invest", investments)

  stream = await traderPaired.getPastEvents(
    'RequestExit', 
    {
      filter: {trader: trader.user},
      fromBlock: 0
    }
  )
  stream.forEach((event) => {
    log("RequestExit", event.returnValues)
    let index = investments.findIndex(investment => investment.id === event.returnValues.id)
    log ("index", index)
    if (index !== -1) {
      let investment = mapRequestExit(event.returnValues)
      log("mapRequestExit", investment)
      investments[index] = {
        ...investments[index],
        ...investment
      }
    }
  })

  log("loadTraderTrustRating - RequestExit", investments)

  stream = await traderPaired.getPastEvents(
    'ApproveExit', 
    {
      filter: {trader: trader.user},
      fromBlock: 0
    }
  )
  stream.forEach((event) => {
    let index = investments.findIndex(investment => investment.id === event.returnValues.id)
    if (index !== -1) {
      let investment = mapApproveExit(event.returnValues)
      investments[index] = {
        ...investments[index],
        ...investment
      }
    }
  })

  log("loadTraderTrustRating - ApproveExit", investments)

  stream = await traderPaired.getPastEvents(
    'RejectExit', 
    {
      filter: {trader: trader.user},
      fromBlock: 0
    }
  )
  stream.forEach((event) => {
    let index = investments.findIndex(investment => investment.id === event.returnValues.id)
    if (index !== -1) {
      let investment = mapRejectExit(event.returnValues)
      investments[index] = {
        ...investments[index],
        ...investment
      }
    }
  })

  log("loadTraderTrustRating - RejectExit", investments)

  let total = 0
  let bad = 0
  let latestApproval = null
  let collateralApprovalCount = 0
  let directApprovalCount = 0
  let investmentDirectTotals = []

  log("investments.forEach BEFORE")
  investments.forEach(async (investment) => {
    if (!investment.approveFrom) {
      if (investmentDirectTotals[investment.token]) {
        investmentDirectTotals[investment.token] = investmentDirectTotals[investment.token].plus(investment.amount)
      } else {
        investmentDirectTotals[investment.token] = investment.amount
      }
    }

    if (investment.requestFrom) {
      total = total + 1

      if (investment.approveFrom) {
        if (!latestApproval || investment.start.isAfter(latestApproval)) {
          latestApproval = investment.start
        }

        if (investment.investmentType === INVESTMENT_DIRECT) {
          directApprovalCount = directApprovalCount + 1
        } else {
          collateralApprovalCount = collateralApprovalCount + 1
        }
      }

      log("Total", total)
      if (investment.requestFrom === trader.user) {
        // trader requested exit, check value
        investment = await getInvestmentValue(network, investment, traderPaired)
        log("Investment Value", investment)
        if (investment.grossValue.lt(investment.value)) {
          // trader requested wrong value
          log("trader requested wrong value", investment.grossValue.toString(), investment.value.toString())
          bad = bad + 1
        }

      } else {
        // investor requested exit
        let now = moment()
        if (investment.approveFrom) {
          if (investment.approveExitDate.diff(investment.requestExitDate) > 48 * 60 * 60 * 1000) {
            bad = bad + 1
          }

        } else if (investment.rejectFrom) {
          investment = await getInvestmentValue(network, investment, traderPaired)
          if (investment.grossValue.lt(investment.rejectValue)) {
            // trader rejected wrong value
            log("trader rejected with wrong value", investment.grossValue.toString(), investment.value.toString(), investment.rejectValue.toString())
            bad = bad + 1
          }
        } else {
          // still waiting
          if (now.diff(investment.requestExitDate) > 48 * 60 * 60 * 1000) {
            bad = bad + 1
          }
        }
      }
    }
  })

  const trustRating = new BigNumber(total - bad).dividedBy(total).multipliedBy(10)

  if (latestApproval && trustRating.gt(8)) {
    // get allocations just before this
    userTokens.forEach(async (token) => {
      log("userTokens", token)
      const allocations = await getTraderAllocations(trader.user, token.address, traderPaired)

      // find the allocation just before the start of this investment
      const allocation = allocations.find(allocation => allocation.date.isBefore(latestApproval))

      if (allocation) {
        // calculate direct investment limit
        let directLimit = allocation.total.multipliedBy(collateralApprovalCount / 10)
        if (directApprovalCount > 0) {
          directLimit = directLimit.plus(allocation.total.multipliedBy(directApprovalCount / 5))
        }

        let directInvested = investmentDirectTotals[token.address]
        if (!directInvested) {
          directInvested = new BigNumber(0)
        }
        log("directLimitLoaded", trader.user, allocation.token, directLimit.toString(), directInvested.toString())
        dispatch(directLimitLoaded(trader.user, allocation.token, directLimit, directInvested))
      }
    })
  }

  log("investments.forEach AFTER")

  log("loadTraderTrustRating", total, bad)
  if (total > 0) {
    dispatch(traderTrustRatingLoaded(trader.user, trustRating))
  }
}
