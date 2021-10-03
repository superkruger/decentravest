'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')

const s3Common = require("../../common/s3Common")
const select = 'position_hash, user_address, dv_profit, max_collateral, dv_asset, created_at, closed_at'

module.exports.create = async (position) => {

  console.log("creating position", position)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/trades/dmex/positions`,
      Key: position.position_hash,
      Body: JSON.stringify(position)
    }).promise()

    console.log("created position", res)
    return true
  } catch (error) {
    console.error("could not create position", error)
  }

  return false
};

module.exports.get = async (uuid) => {

  console.log("get position", uuid)

  if (!s3Common.hasData(`${process.env.eventbucket}/trades/dmex/positions`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM dmex_positions WHERE position_hash = '${uuid}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null
}

module.exports.getByOwner = async (owner) => {

  console.log("getByOwner", owner)

  if (!s3Common.hasData(`${process.env.eventbucket}/trades/dmex/positions`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM dmex_positions WHERE user_address = '${owner}' ORDER by closed_at`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      return results.Items
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return []
}

module.exports.getLastByOwner = async (owner) => {

  console.log("getLastByOwner", owner)

  if (!s3Common.hasData(`${process.env.eventbucket}/trades/dmex/positions`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM dmex_positions WHERE user_address = '${owner}' ORDER BY closed_at desc LIMIT 1`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null
}
