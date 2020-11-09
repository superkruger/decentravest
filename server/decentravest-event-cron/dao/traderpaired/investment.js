'use strict';

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, returnvalues.wallet, returnvalues.investor, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating investment", event, `${process.env.eventbucket}/traderpaired-investment`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-investment`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created investment", res)
    return true
  } catch (error) {
    console.log("could not create investment", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("get event", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investment`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investment where id = '${id}'`
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

module.exports.list = async () => {

  console.log("list events")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investment`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investment`
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

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investment`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investment ORDER BY blockNumber desc LIMIT 1`
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


const mapInvestment = (event) => {

  return {
    id: event.id,
    blockNumber: event.blockNumber,
    wallet: event.wallet,
    investor: event.investor,
    eventDate: event.mdate
  }
}

