'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, returnvalues.id as investmentid, returnvalues.wallet, returnvalues.trader, returnvalues.investor, returnvalues.token, \
    returnvalues.amount, returnvalues.investorprofitpercent, returnvalues.investmenttype, \
    returnvalues.allocationinvested, returnvalues.allocationtotal, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating invest", event, `${process.env.eventbucket}/traderpaired-invest`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-invest`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created invest", res)
    return true
  } catch (error) {
    console.log("could not create invest", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting invest", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByInvestmentId = async (id) => {

  console.log("getting invest", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE returnvalues.id = '${id}' ORDER BY returnvalues.mdate desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("getting invests")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest`
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

module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest ORDER BY blockNumber desc LIMIT 1`
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

module.exports.getEventsFromBlock = async(blockNumber) => {
  console.log("getting invests from block", blockNumber)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE blockNumber >= ${blockNumber} ORDER BY blockNumber`
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

module.exports.getByTrader = async (trader) => {

  console.log("getting invests for trader", trader)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE returnvalues.trader = '${trader}'`
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

module.exports.getByInvestor = async (investor) => {

  console.log("getting invests for investor", investor)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE returnvalues.investor = '${investor}'`
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

  console.log("getting invests for trader and token", trader, token)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE returnvalues.trader = '${trader}' AND returnvalues.token = '${token}'`
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

module.exports.getByTraderAndTokenBefore = async (trader, token, beforeDate) => {

  console.log("getting invests for trader before", trader, token, beforeDate)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE returnvalues.trader = '${trader}' AND returnvalues.token = '${token}' AND returnvalues.mdate < ${beforeDate}`
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

const mapInvest = (event) => {

  return {
    id: event.id,
    blockNumber: event.blockNumber,
    investmentId: event.investmentid,
    wallet: event.wallet,
    trader: event.trader,
    investor: event.investor,
    token: event.token,
    amount: new BigNumber(event.amount),
    investorProfitPercent: new BigNumber(event.investorprofitpercent),
    investmentType: event.investmenttype,
    allocationInvested: new BigNumber(event.allocationinvested),
    allocationTotal: new BigNumber(event.allocationtotal),
    eventDate: event.mdate
  }
}


