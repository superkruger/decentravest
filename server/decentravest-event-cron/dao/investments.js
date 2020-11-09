'use strict';


const helpers = require('../helpers')

const s3Common = require("../common/s3Common")
const select = 'investBlockNumber, stopBlockNumber, requestBlockNumber, rejectBlockNumber, approveBlockNumber, \
  id, disbursementId, wallet, trader, investor, token, amount, value, \
  grossValue, nettValue, investorProfitPercent, investmentType, state, traderLimit, startDate, endDate'

module.exports.create = async (investment) => {

  // const investment = mapCreateEvent(event)

  console.log("creating investment", investment)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.investmentbucket}`,
      Key: investment.id,
      Body: JSON.stringify(investment)
    }).promise()

    console.log("created investment", res)
    return true
  } catch (error) {
    console.log("could not create investment", error)
  }

  return false
}

module.exports.update = async (investment) => {

  console.log("updating investment", investment)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.investmentbucket}`,
      Key: investment.id,
      Body: JSON.stringify(investment)
    }).promise()

    console.log("updated investment", res)
  } catch (error) {
    console.log("could not updated investment", error)
    return false
  }

  return true
}

module.exports.get = async (id) => {

  console.log("getting investment", id)

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM investments WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got investment", results.Items[0])
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.listActive = async () => {
  console.log("getting active investments")

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM investments WHERE state != ${helpers.INVESTMENT_STATE_EXITAPPROVED} ORDER BY startDate desc`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      const res = results.Items
      return res
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getInvestLast = async (account) => {

  console.log("getting last investment")

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM investments ORDER BY investBlockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getStopLast = async (account) => {

  console.log("getting last investment")

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM investments ORDER BY stopBlockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getRequestLast = async (account) => {

  console.log("getting last investment")

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM investments ORDER BY requestBlockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getRejectLast = async (account) => {

  console.log("getting last investment")

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM investments ORDER BY rejectBlockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getApproveLast = async (account) => {

  console.log("getting last investment")

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM investments ORDER BY approveBlockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByTrader = async (account) => {

  console.log("getting investments for trader", account)

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM investments WHERE trader = '${account}' ORDER BY startDate desc`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      const res = results.Items
      return res
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getByInvestor = async (account) => {

  console.log("getting investments for investor", account)

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM investments WHERE investor = '${account}' ORDER BY startDate desc`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      const res = results.Items
      return res
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getByTraderAndToken = async (trader, token) => {

  console.log("getting investments for trader and token", trader, token)

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM investments WHERE trader = '${trader}' AND token = '${token}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getByTraderUpTo = async (trader, startDate) => {

  console.log("getting investments for trader up to", trader, startDate)

  if (!s3Common.hasData(`${process.env.investmentbucket}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM investments WHERE trader = '${trader}' AND startDate <= ${startDate}`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}


