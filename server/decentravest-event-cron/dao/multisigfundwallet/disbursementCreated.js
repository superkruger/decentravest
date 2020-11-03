'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.trader, returnvalues.initiator, \
  returnvalues.investmentid, returnvalues.disbursementid, returnvalues.value, returnvalues.amount, returnvalues.mdate'

module.exports.create = async (walletAddress, event) => {

  console.log("creating disbursementCreated", event, `${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created disbursementCreated", res)
    return true
  } catch (error) {
    console.log("could not create disbursementCreated", error)
  }

  return false
};

module.exports.get = async (walletAddress, id) => {

  console.log("getting disbursementCreated", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_disbursementcreated WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return mapDisbursementCreated(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async (walletAddress) => {

  console.log("getting disbursementCreateds")

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_disbursementcreated`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapDisbursementCreated)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getLast = async (walletAddress) => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_disbursementcreated ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapDisbursementCreated(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getLastForInvestment = async (walletAddress, investmentId) => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_disbursementcreated WHERE returnvalues.investmentid = '${investmentId}' ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapDisbursementCreated(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByTrader = async (walletAddress, trader) => {

  console.log("getting disbursementCreateds for trader", trader)

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-disbursementcreated/${walletAddress}`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_disbursementcreated WHERE returnvalues.trader = '${trader}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items.map(mapDisbursementCreated)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

const mapDisbursementCreated = (event) => {

  return {
    blockNumber: event.blockNumber,
    trader: event.trader, 
    initiator: event.initiator,
    investmentId: event.investmentid, 
    disbursementId: event.disbursementid,
    value: new BigNumber(event.value), 
    amount: new BigNumber(event.amount), 
    eventDate: event.mdate
  }
}


