'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.id, returnvalues.wallet, returnvalues.trader, \
  returnvalues.investor, returnvalues.approvefrom, returnvalues.allocationinvested, \
  returnvalues.allocationtotal, returnvalues.eventdate'

module.exports.create = async (event) => {

  console.log("creating approveExit", event, `${process.env.eventbucket}/traderpaired-approveexit`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-approveexit`,
      Key: event.id,
      Body: JSON.stringify(mapEvent(event))
    }).promise()

    console.log("created approveExit", res)
  } catch (error) {
    console.log("could not create approveExit", error)
  }

  return event.id;
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
      return mapApproveExit(results.Items[0])
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

      return results.Items.map(mapApproveExit)
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
      return mapApproveExit(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
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

      return results.Items.map(mapApproveExit)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

const mapApproveExit = (event) => {

  return {
    blockNumber: event.blockNumber,
    id: event.id, 
    wallet: event.wallet, 
    trader: event.trader,
    investor: event.investor, 
    approveFrom: event.approvefrom, 
    allocationInvested: new BigNumber(event.allocationinvested),
    allocationTotal: new BigNumber(event.allocationtotal), 
    eventDate: event.eventdate
  }
}

const mapEvent = (event) => {
  event.returnValues.eventDate = event.returnValues.date
  event.returnValues.approveFrom = event.returnValues.from

  return {
    ...event
  }
}


