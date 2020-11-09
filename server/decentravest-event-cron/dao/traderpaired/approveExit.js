'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, returnvalues.id as investmentid, returnvalues.wallet, returnvalues.trader, \
  returnvalues.investor, returnvalues.mfrom, returnvalues.allocationinvested, \
  returnvalues.allocationtotal, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating approveExit", event, `${process.env.eventbucket}/traderpaired-approveexit`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-approveexit`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created approveExit", res)
    return true
  } catch (error) {
    console.log("could not create approveExit", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting approveExit", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit WHERE id = '${id}'`
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

  console.log("getting approveExit", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit WHERE returnvalues.id = '${id}' ORDER BY returnvalues.mdate desc LIMIT 1`
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

  console.log("getting approveExits")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit`
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

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit ORDER BY blockNumber desc LIMIT 1`
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
  console.log("getting approveExits from block", blockNumber)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit WHERE blockNumber >= ${blockNumber} ORDER BY blockNumber`
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

  console.log("getting approveExits for trader", trader)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit WHERE returnvalues.trader = '${trader}'`
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

module.exports.getByInvestor = async (investor) => {

  console.log("getting approveExits for investor", investor)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit WHERE returnvalues.investor = '${investor}'`
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

module.exports.getByTraderFrom = async (trader, fromDate) => {

  console.log("getting approveExits for trader from", trader, fromDate)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-approveexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_approveexit WHERE returnvalues.trader = '${trader}' AND returnvalues.mdate > ${fromDate}`
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

const mapApproveExit = (event) => {

  return {
    id: event.id,
    blockNumber: event.blockNumber,
    investmentId: event.investmentid, 
    wallet: event.wallet, 
    trader: event.trader,
    investor: event.investor, 
    approveFrom: event.mfrom, 
    allocationInvested: new BigNumber(event.allocationinvested),
    allocationTotal: new BigNumber(event.allocationtotal), 
    eventDate: event.mdate
  }
}


