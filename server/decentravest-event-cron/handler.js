require('dotenv').config()

const mysqlCommon = require('./common/mysql')
const encode = require('./common/encode')
const interactions = require('./interactions')
const traderStatisticsDao = require('./dao/traderStatistics')
const investorStatisticsDao = require('./dao/investorStatistics')
const tradesMysql = require('./mysql/trades')
const investmentsMysql = require('./mysql/investments')

const loadTraderPaired = async () => {
  const {web3, networkId} = await interactions.loadWeb3()
  console.log("loaded web3: ", web3, networkId)
  const traderPaired = await interactions.loadTraderPaired(web3, networkId)
  console.log("loaded traderPaired: ", traderPaired)
  return {web3, traderPaired}
}

module.exports.processAllEvents = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessAllEvents();
	
	return "processed all events";
}

module.exports.processAllTrades = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessAllTrades();

	return "processed all trades";
}

module.exports.calculateAllTradersStatistics = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localCalculateAllTradersStatistics();

	return "calculated statistics";
}

module.exports.calculateAllInvestorsStatistics = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  localCalculateAllInvestorsStatistics();

  return "calculated statistics";
}

module.exports.calculateAllInvestmentValues = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  localCalculateAllInvestmentValues();

  return "calculated investment values";
}

module.exports.statistics = async (event, context) => {
  console.log("statistics", event, context)

  try {
    let result
    if (event.queryStringParameters.investor) {
      result = await investorStatisticsDao.getStatistics(event.queryStringParameters.investor)
    } else if (event.queryStringParameters.trader) {
      result = await traderStatisticsDao.getStatistics(event.queryStringParameters.trader)
    } else {
      throw "unknown query parameter for statistics"
    }

  	return encode.success(result);
  } catch (error) {
  	console.error("could not get statistics", error)
  	return encode.error(error, "could not get statistics");
  }
}

module.exports.trades = async (event, context) => {
  console.log("trades", event, context)

  try {
  	const result = await tradesMysql.getByTrader(event.queryStringParameters.trader)
  	return encode.success(result);
  } catch (error) {
  	console.error("could not get trades", error)
  	return encode.error(error, "could not get trades");
  }
}

module.exports.userAction = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.action !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "action could not be determined")
  }

  switch(data.action) {
    case 'createTables': {
      return localCreateTables()
      break
    }
    case 'traderJoined': {
      if (typeof data.trader !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localJoinedTrader(data.trader)
      break
    }
    case 'investorJoined': {
      if (typeof data.investor !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localJoinedInvestor(data.investor)
      break
    }
    case 'createdInvestment': {
      if (typeof data.investmentId !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localCreatedInvestment(data.investmentId)
      break
    }
    case 'stoppedInvestment': {
      if (typeof data.investmentId !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localStoppedInvestment(data.investmentId)
      break
    }
    case 'exitRequested': {
      if (typeof data.investmentId !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localExitRequested(data.investmentId)
      break
    }
    case 'exitRejected': {
      if (typeof data.investmentId !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localExitRejected(data.investmentId)
      break
    }
    case 'exitApproved': {
      if (typeof data.investmentId !== 'string') {
        return encode.error(new Error(`${data.action} error`), "action parameters missing")
      }
      return localExitApproved(data.investmentId)
      break
    }
    default:
      return encode.error(new Error(`Action error`), "action unknown")
  }
}

module.exports.investments = async (event, context) => {
  console.log("investments", event, context)

  try {
    let result
    if (event.queryStringParameters.investor) {
      result = await investmentsMysql.getByInvestor(event.queryStringParameters.investor)
    } else if (event.queryStringParameters.trader) {
      result = await investmentsMysql.getByTrader(event.queryStringParameters.trader)
    } else {
      throw "unknown query parameter for investments"
    }
    return encode.success(result);
  } catch (error) {
    console.error("could not get investments", error)
    return encode.error(error, "could not get investments");
  }
}

const localProcessAllEvents = async () => {
  const {web3, traderPaired} = await loadTraderPaired()
	
	await interactions.processAllEvents(web3, traderPaired)
}
module.exports.localProcessAllEvents = localProcessAllEvents

const localProcessAllTrades = async () => {
	await interactions.processAllTrades();
}
module.exports.localProcessAllTrades = localProcessAllTrades

const localCreateTables = async () => {
  try {
    const result = await mysqlCommon.createTables()
    if (!result) {
      throw "error creating tables"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not create tables", error)
    return encode.error(error, "could not create tables")
  }
}

const localJoinedTrader = async (trader) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.joinedTrader(trader, traderPaired)
    if (!result) {
      throw "error processing trader"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not join trader", error)
    return encode.error(error, "could not join trader")
  }
}

const localJoinedInvestor = async (investor) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.joinedInvestor(investor, traderPaired)
    if (!result) {
      throw "error processing investor"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not join investor", error)
    return encode.error(error, "could not join investor")
  }
}

const localCreatedInvestment = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.createdInvestment(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment creation"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not create investment", error)
    return encode.error(error, "could not create investment")
  }
}

const localStoppedInvestment = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.stoppedInvestment(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment stop"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not stop investment", error)
    return encode.error(error, "could not stop investment")
  }
}

const localExitRequested = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.exitRequested(investmentId, web3, traderPaired)
    if (!result) {
      throw "error processing investment exit request"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not request exit", error)
    return encode.error(error, "could not request exit")
  }
}

const localExitRejected = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.exitRejected(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment exit reject"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not reject exit", error)
    return encode.error(error, "could not reject exit")
  }
}

const localExitApproved = async (investmentId) => {
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    const result = await interactions.exitApproved(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment exit approval"
    }
    return encode.success(result)
  } catch (error) {
    console.error("could not reject approved", error)
    return encode.error(error, "could not reject approved")
  }
}

const localCalculateAllTradersStatistics = async () => {
	await interactions.calculateAllTradersStatistics();
}
module.exports.localCalculateAllTradersStatistics = localCalculateAllTradersStatistics

const localCalculateAllInvestorsStatistics = async () => {
  await interactions.calculateAllInvestorsStatistics();
}
module.exports.localCalculateAllInvestorsStatistics = localCalculateAllInvestorsStatistics

const localCalculateAllInvestmentValues = async () => {
  await interactions.calculateAllInvestmentValues();
}
module.exports.localCalculateAllInvestmentValues = localCalculateAllInvestmentValues