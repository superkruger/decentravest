'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.id, returnvalues.wallet, \
  returnvalues.trader, returnvalues.value, returnvalues.mfrom, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating rejectExit", event, `${process.env.eventbucket}/traderpaired-rejectexit`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-rejectexit`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created rejectExit", res)
  } catch (error) {
    console.log("could not create rejectExit", error)
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting rejectExit", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-rejectexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_rejectexit WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return mapRejectExit(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("getting rejectExits")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-rejectexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_rejectexit`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapRejectExit)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-rejectexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_rejectexit ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapRejectExit(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByTrader = async (trader) => {

  console.log("getting rejectExits for trader", trader)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-rejectexit`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_rejectexit WHERE returnvalues.trader = '${trader}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapRejectExit)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

const mapRejectExit = (event) => {

  return {
    blockNumber: event.blockNumber,
    id: event.id, 
    wallet: event.wallet,
    trader: event.trader, 
    value: new BigNumber(event.value), 
    rejectFrom: event.mfrom, 
    eventDate: event.mdate
  }
}


