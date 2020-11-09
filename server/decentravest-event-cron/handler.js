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

	localProcessAllEvents()

  mysqlCommon.quitClient()
	
	return "processed all events";
}

module.exports.processAllTrades = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessAllTrades()

  mysqlCommon.quitClient()

	return "processed all trades";
}

module.exports.calculateAllTradersStatistics = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localCalculateAllTradersStatistics()

  mysqlCommon.quitClient()

	return "calculated statistics";
}

module.exports.calculateAllInvestorsStatistics = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  localCalculateAllInvestorsStatistics()

  mysqlCommon.quitClient()

  return "calculated statistics";
}

module.exports.calculateAllInvestmentValues = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  localCalculateAllInvestmentValues()

  mysqlCommon.quitClient()

  return "calculated investment values";
}

module.exports.statistics = async (event, context) => {
  console.log("statistics", event, context)

  let result
  try {
    if (event.queryStringParameters.investor) {
      result = await investorStatisticsDao.getStatistics(event.queryStringParameters.investor)
    } else if (event.queryStringParameters.trader) {
      result = await traderStatisticsDao.getStatistics(event.queryStringParameters.trader)
    } else {
      throw "unknown query parameter for statistics"
    }

  	result = encode.success(result);
  } catch (error) {
  	console.error("could not get statistics", error)
  	result = encode.error(error, "could not get statistics");
  }

  mysqlCommon.quitClient()

  return result
}

module.exports.trades = async (event, context) => {
  console.log("trades", event, context)
  let result

  try {
  	result = await tradesMysql.getByTrader(event.queryStringParameters.trader)
  	result = encode.success(result);
  } catch (error) {
  	console.error("could not get trades", error)
  	result = encode.error(error, "could not get trades");
  }

  mysqlCommon.quitClient()

  return result
}

module.exports.userAction = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  const data = JSON.parse(event.body)
  if (typeof data.action !== 'string') {
    console.error('Validation Failed')
    return encode.error(new Error('Couldn\'t createdInvestment.'), "action could not be determined")
  }

  let result

  switch(data.action) {
    case 'createTables': {
      result = localCreateTables()
      break
    }
    case 'traderJoined': {
      if (typeof data.trader !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localJoinedTrader(data.trader)
      }
      break
    }
    case 'investorJoined': {
      if (typeof data.investor !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localJoinedInvestor(data.investor)
      }
      break
    }
    case 'createdInvestment': {
      if (typeof data.investmentId !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localCreatedInvestment(data.investmentId)
      }
      break
    }
    case 'stoppedInvestment': {
      if (typeof data.investmentId !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localStoppedInvestment(data.investmentId)
      }
      break
    }
    case 'exitRequested': {
      if (typeof data.investmentId !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localExitRequested(data.investmentId)
      }
      break
    }
    case 'exitRejected': {
      if (typeof data.investmentId !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localExitRejected(data.investmentId)
      }
      break
    }
    case 'exitApproved': {
      if (typeof data.investmentId !== 'string') {
        result = encode.error(new Error(`${data.action} error`), "action parameters missing")
      } else {
        result = localExitApproved(data.investmentId)
      }
      break
    }
    default:
      result = encode.error(new Error(`Action error`), "action unknown")
  }

  mysqlCommon.quitClient()
  return result
}

module.exports.investments = async (event, context) => {
  console.log("investments", event, context)

  let result

  try {
    if (event.queryStringParameters.investor) {
      result = await investmentsMysql.getByInvestor(event.queryStringParameters.investor)
    } else if (event.queryStringParameters.trader) {
      result = await investmentsMysql.getByTrader(event.queryStringParameters.trader)
    } else {
      throw "unknown query parameter for investments"
    }
    result = encode.success(result);
  } catch (error) {
    console.error("could not get investments", error)
    result = encode.error(error, "could not get investments");
  }

  mysqlCommon.quitClient()
  return result
}

const localProcessAllEvents = async () => {
  const {web3, traderPaired} = await loadTraderPaired()
	
	await interactions.processAllEvents(web3, traderPaired)

  mysqlCommon.quitClient()
}
module.exports.localProcessAllEvents = localProcessAllEvents

const localProcessAllTrades = async () => {
	await interactions.processAllTrades();

  mysqlCommon.quitClient()
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
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.joinedTrader(trader, traderPaired)
    if (!result) {
      throw "error processing trader"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not join trader", error)
    result = encode.error(error, "could not join trader")
  }

  mysqlCommon.quitClient()
  return result
}

const localJoinedInvestor = async (investor) => {
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.joinedInvestor(investor, traderPaired)
    if (!result) {
      throw "error processing investor"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not join investor", error)
    result = encode.error(error, "could not join investor")
  }

  mysqlCommon.quitClient()
  return result
}

const localCreatedInvestment = async (investmentId) => {
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.createdInvestment(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment creation"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not create investment", error)
    result = encode.error(error, "could not create investment")
  }

  mysqlCommon.quitClient()
  return result
}

const localStoppedInvestment = async (investmentId) => {
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.stoppedInvestment(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment stop"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not stop investment", error)
    result = encode.error(error, "could not stop investment")
  }

  mysqlCommon.quitClient()
  return result
}

const localExitRequested = async (investmentId) => {
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.exitRequested(investmentId, web3, traderPaired)
    if (!result) {
      throw "error processing investment exit request"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not request exit", error)
    result = encode.error(error, "could not request exit")
  }

  mysqlCommon.quitClient()
  return result
}

const localExitRejected = async (investmentId) => {
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.exitRejected(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment exit reject"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not reject exit", error)
    result = encode.error(error, "could not reject exit")
  }

  mysqlCommon.quitClient()
  return result
}

const localExitApproved = async (investmentId) => {
  let result
  try {
    const {web3, traderPaired} = await loadTraderPaired()
    result = await interactions.exitApproved(investmentId, traderPaired)
    if (!result) {
      throw "error processing investment exit approval"
    }
    result = encode.success(result)
  } catch (error) {
    console.error("could not reject approved", error)
    result = encode.error(error, "could not reject approved")
  }

  mysqlCommon.quitClient()
  return result
}

const localCalculateAllTradersStatistics = async () => {
	await interactions.calculateAllTradersStatistics();
  mysqlCommon.quitClient()
}
module.exports.localCalculateAllTradersStatistics = localCalculateAllTradersStatistics

const localCalculateAllInvestorsStatistics = async () => {
  await interactions.calculateAllInvestorsStatistics();
  mysqlCommon.quitClient()
}
module.exports.localCalculateAllInvestorsStatistics = localCalculateAllInvestorsStatistics

const localCalculateAllInvestmentValues = async () => {
  try {
    await interactions.calculateAllInvestmentValues();
  }
  catch(error) {
    console.error("localCalculateAllInvestmentValues error", error)
  }
  mysqlCommon.quitClient()
}
module.exports.localCalculateAllInvestmentValues = localCalculateAllInvestmentValues