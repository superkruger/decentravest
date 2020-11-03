require('dotenv').config()

const encode = require('./common/encode')
const interactions = require('./interactions')
const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')
const positionsDao = require('./dao/dydx/positions')
const tradesDao = require('./dao/trades')
const investmentsDao = require('./dao/investments')

const loadTraderPaired = async () => {
  const {web3, networkId} = await interactions.loadWeb3()
  console.log("loaded web3: ", web3, networkId)
  const traderPaired = await interactions.loadTraderPaired(web3, networkId)
  console.log("loaded traderPaired: ", traderPaired)
  return {web3, traderPaired}
}

module.exports.processEvents = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessEvents();
	
	return "processed events";
}

module.exports.processTrades = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessTrades();

	return "processed trades";
}

module.exports.calculateTraderStatistics = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localCalculateTraderStatistics();

	return "calculated statistics";
}

module.exports.calculateInvestorStatistics = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  localCalculateInvestorStatistics();

  return "calculated statistics";
}

module.exports.traderStatistics = async (event, context) => {
  console.log("traderStatistics", event, context)

  try {
  	const result = await traderStatisticsDao.getStatistics(event.queryStringParameters.trader)
  	return encode.success(result);
  } catch (error) {
  	console.error("could not get statistics", error)
  	return encode.error(error, "could not get statistics");
  }
}

module.exports.investorStatistics = async (event, context) => {
  console.log("investorStatistics", event, context)

  try {
    const result = await investorStatisticsDao.getStatistics(event.queryStringParameters.investor)
    return encode.success(result);
  } catch (error) {
    console.error("could not get statistics", error)
    return encode.error(error, "could not get statistics");
  }
}

module.exports.positions = async (event, context) => {
  console.log("positions", event, context)

  try {
  	const result = await positionsDao.getByOwner(event.queryStringParameters.trader)
  	return encode.success(result);
  } catch (error) {
  	console.error("could not get positions", error)
  	return encode.error(error, "could not get positions");
  }
}

module.exports.trades = async (event, context) => {
  console.log("trades", event, context)

  try {
  	const result = await tradesDao.getTrades(event.queryStringParameters.trader)
  	return encode.success(result);
  } catch (error) {
  	console.error("could not get trades", error)
  	return encode.error(error, "could not get trades");
  }
}

module.exports.createdInvestment = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.investmentId !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "investmentId argument missing")
  }

  return localCreatedInvestment(data.investmentId)
}

module.exports.stoppedInvestment = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.investmentId !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "investmentId argument missing")
  }

  return localStoppedInvestment(data.investmentId)
}

module.exports.exitRequested = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.investmentId !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "investmentId argument missing")
  }

  return localExitRequested(data.investmentId)
}

module.exports.exitRejected = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.investmentId !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "investmentId argument missing")
  }

  return localExitRejected(data.investmentId)
}

module.exports.exitApproved = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.investmentId !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "investmentId argument missing")
  }

  return localExitApproved(data.investmentId)
}

module.exports.investments = async (event, context) => {
  console.log("investments", event, context)

  try {
    let result
    if (event.queryStringParameters.investor) {
      result = await investmentsDao.getByInvestor(event.queryStringParameters.investor)
    } else if (event.queryStringParameters.trader) {
      result = await investmentsDao.getByTrader(event.queryStringParameters.trader)
    } else {
      throw "unknown query parameter for investments"
    }
    return encode.success(result);
  } catch (error) {
    console.error("could not get investments", error)
    return encode.error(error, "could not get investments");
  }
}

const localProcessEvents = async () => {
  const {web3, traderPaired} = await loadTraderPaired()
	
	await interactions.processEvents(web3, traderPaired)
}
module.exports.localProcessEvents = localProcessEvents

const localProcessTrades = async () => {
	await interactions.processTrades();
}
module.exports.localProcessTrades = localProcessTrades

const localCreatedInvestment = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.createdInvestment(investmentId, traderPaired)
    return encode.success(result)
  } catch (error) {
    console.error("could not create investment", error)
    return encode.error(error, "could not create investment")
  }
}
module.exports.localCreatedInvestment = localCreatedInvestment

const localStoppedInvestment = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.stoppedInvestment(investmentId, traderPaired)
    return encode.success(result)
  } catch (error) {
    console.error("could not stop investment", error)
    return encode.error(error, "could not stop investment")
  }
}
module.exports.localStoppedInvestment = localStoppedInvestment

const localExitRequested = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.exitRequested(investmentId, web3, traderPaired)
    return encode.success(result)
  } catch (error) {
    console.error("could not request exit", error)
    return encode.error(error, "could not request exit")
  }
}
module.exports.localExitRequested = localExitRequested

const localExitRejected = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.exitRejected(investmentId, traderPaired)
    return encode.success(result)
  } catch (error) {
    console.error("could not reject exit", error)
    return encode.error(error, "could not reject exit")
  }
}
module.exports.localExitRejected = localExitRejected

const localExitApproved = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.exitApproved(investmentId, traderPaired)
    console.log("localExitApproved result", result)
    return encode.success(result)
  } catch (error) {
    console.error("could not reject approved", error)
    return encode.error(error, "could not reject approved")
  }
}
module.exports.localExitApproved = localExitApproved

const localCalculateTraderStatistics = async () => {
	await interactions.calculateTraderStatistics();
}
module.exports.localCalculateTraderStatistics = localCalculateTraderStatistics

const localCalculateInvestorStatistics = async () => {
  await interactions.calculateInvestorStatistics();
}
module.exports.localCalculateInvestorStatistics = localCalculateInvestorStatistics
