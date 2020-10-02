'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.id, returnvalues.wallet, \
  returnvalues.trader, returnvalues.investor, returnvalues.mfrom, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating stop", event, `${process.env.eventbucket}/traderpaired-stop`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-stop`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created stop", res)
  } catch (error) {
    console.log("could not create stop", error)
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting stop", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-stop`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_stop WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return mapStop(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("getting stops")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-stop`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_stop`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapStop)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-stop`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_stop ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapStop(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByTrader = async (trader) => {

  console.log("getting stops for trader", trader)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-stop`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_stop WHERE returnvalues.trader = '${trader}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapStop)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getByTraderAndToken = async (trader, token) => {

  console.log("getting stops for trader and token", trader, token)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-stop`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_stop WHERE returnvalues.trader = '${trader}' AND returnvalues.token = '${token}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapStop)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

const mapStop = (event) => {

  return {
    blockNumber: event.blockNumber,
    id: event.id, 
    wallet: event.wallet,
    trader: event.trader, 
    investor: event.investor, 
    stopFrom: event.mfrom, 
    eventDate: event.mdate
  }
}

