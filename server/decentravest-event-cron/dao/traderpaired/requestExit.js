'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.id, returnvalues.wallet, returnvalues.trader, returnvalues.investor, \
  returnvalues.mfrom, returnvalues.value, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating requestExit", event, `${process.env.eventbucket}/traderpaired-requestexit`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-requestexit`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created requestExit", res)
  } catch (error) {
    console.log("could not create requestExit", error)
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting requestExit", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-requestexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_requestexit WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return mapRequestExit(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("getting requestExits")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-requestexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_requestexit`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapRequestExit)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-requestexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_requestexit ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapRequestExit(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByTrader = async (trader) => {

  console.log("getting requestExits for trader", trader)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-requestexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_requestexit WHERE returnvalues.trader = '${trader}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapRequestExit)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getByInvestor = async (investor) => {

  console.log("getting requestExits for investor", investor)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-requestexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_requestexit WHERE returnvalues.investor = '${investor}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapRequestExit)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

const mapRequestExit = (event) => {

  return {
    blockNumber: event.blockNumber,
    id: event.id, 
    wallet: event.wallet, 
    trader: event.trader, 
    investor: event.investor,
    requestFrom: event.mfrom, 
    value: new BigNumber(event.value), 
    eventDate: event.mdate
  }
}

