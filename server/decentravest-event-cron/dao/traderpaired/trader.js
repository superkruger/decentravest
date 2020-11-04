'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = `blockNumber, returnvalues.user, returnvalues.traderid, \
  returnvalues.investorcollateralprofitpercent, returnvalues.investordirectprofitpercent, returnvalues.mdate`

module.exports.create = async (event) => {

  console.log("creating trader", event, `${process.env.eventbucket}/traderpaired-trader`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-trader`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created trader", res)
    return true
  } catch (error) {
    console.log("could not create trader", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting trader", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-trader`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_trader where id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapTrader(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error)
  }
  
  return null;
}

module.exports.getByUser = async (id) => {

  console.log("getting trader", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-trader`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_trader where returnvalues.user = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapTrader(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error)
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("getting traders")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-trader`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_trader`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items.map(mapTrader)
    }
  } catch (error) {
    console.log("athena error", error)
  }
  
  return [];
}


module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-trader`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_trader ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapTrader(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error)
  }
  
  return null;
}

const mapTrader = (event) => {

  return {
    blockNumber: event.blockNumber,
    user: event.user,
    traderId: event.traderid,
    investorCollateralProfitPercent: new BigNumber(event.investorcollateralprofitpercent),
    investorDirectProfitPercent: new BigNumber(event.investordirectprofitpercent),
    eventDate: event.mdate
  }
}

