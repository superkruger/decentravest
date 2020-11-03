'use strict';

const s3Common = require("../../common/s3Common")
const select = 'blockNumber, returnvalues.user, returnvalues.investorid, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating investor", event, `${process.env.eventbucket}/traderpaired-investor`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-investor`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created investor", res)
    return true
  } catch (error) {
    console.log("could not create investor", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("get event", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investor`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investor where id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapInvestor(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.list = async () => {

  console.log("list events")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investor`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investor`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items.map(mapInvestor)
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return [];
}

module.exports.getLast = async () => {

  console.log("getting last event")

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investor`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investor ORDER BY blockNumber desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return mapInvestor(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}


const mapInvestor = (event) => {

  return {
    blockNumber: event.blockNumber,
    user: event.user,
    investorId: event.investorid,
    eventDate: event.mdate
  }
}

