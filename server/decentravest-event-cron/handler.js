require('dotenv').config()

const encode = require('./common/encode')
const interactions = require('./interactions')
const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')
const positionsDao = require('./dao/dydx/positions')
const tradesDao = require('./dao/trades')

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
  	const result = await tradesDao.getByOwner(event.queryStringParameters.trader)
  	return encode.success(result);
  } catch (error) {
  	console.error("could not get trades", error)
  	return encode.error(error, "could not get trades");
  }
}

const localProcessEvents = async () => {
	let {web3, networkId} = await interactions.loadWeb3();
	console.log("loaded web3: ", web3, networkId);
	
	await interactions.processEvents(web3, networkId);
}
module.exports.localProcessEvents = localProcessEvents

const localProcessTrades = async () => {
	await interactions.processTrades();
}
module.exports.localProcessTrades = localProcessTrades

const localCalculateTraderStatistics = async () => {
	await interactions.calculateTraderStatistics();
}
module.exports.localCalculateTraderStatistics = localCalculateTraderStatistics

const localCalculateInvestorStatistics = async () => {
  await interactions.calculateInvestorStatistics();
}
module.exports.localCalculateInvestorStatistics = localCalculateInvestorStatistics
