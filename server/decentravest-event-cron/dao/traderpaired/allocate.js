'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.trader, returnvalues.token, \
	returnvalues.total, returnvalues.invested, returnvalues.eventdate'

module.exports.create = async (event) => {

  console.log("creating allocate", event, `${process.env.eventbucket}/traderpaired-allocate`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-allocate`,
      Key: event.id,
      Body: JSON.stringify(mapEvent(event))
    }).promise()

    console.log("created allocate", res)
  } catch (error) {
    console.log("could not create allocate", error)
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting allocate", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-allocate`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_allocate WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return mapAllocate(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("getting allocations")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-allocate`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_allocate`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapAllocate)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-allocate`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_allocate ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapAllocate(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByTraderAndToken = async (trader, token) => {

  console.log("getting allocations for trader and token", trader, token)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-allocate`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_allocate WHERE returnvalues.trader = '${trader}' AND returnvalues.token = '${token}' ORDER by returnvalues.eventdate desc`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapAllocate)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

const mapAllocate = (event) => {

  return {
    blockNumber: event.blockNumber,
    trader: event.trader, 
    token: event.token,
	total: new BigNumber(event.total), 
	invested: new BigNumber(event.invested), 
	eventDate: event.eventdate
  }
}

const mapEvent = (event) => {
  event.returnValues.eventDate = event.returnValues.date

  return {
    ...event
  }
}

