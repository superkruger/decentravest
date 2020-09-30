'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')

const s3Common = require("../../common/s3Common")
const select = 'uuid, owner, market, type, status, updatedAt, dv_profit, dv_initialAmount, dv_asset, dv_start, dv_end'

module.exports.create = async (position) => {

  console.log("creating position", position)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/dydx-positions`,
      Key: position.uuid,
      Body: JSON.stringify(position)
    }).promise()

    console.log("created position", res)
  } catch (error) {
    console.log("could not create position", error)
  }

  return position.uuid;
};

module.exports.get = async (id) => {

  console.log("getting position", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/dydx-positions`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM dydx_positions WHERE uuid = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got position", results.Items[0])
      return mapPosition(results.Items[0])
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}

module.exports.getByOwner = async (owner) => {

  console.log("getByOwner", owner)

  if (!s3Common.hasData(`${process.env.eventbucket}/dydx-positions`)) {
    return []
  }

  const query = {
    sql: `SELECT ${select} FROM dydx_positions WHERE owner = '${owner}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got positions", results.Items)
      return results.Items.map(mapPosition)
    } else {
      console.log("got no positions")
    }
  } catch (error) {
    console.log("athena error", error);
  }

  return [];
}

const mapPosition = (event) => {
  return {
    uuid: event.uuid,
    owner: event.owner,
    market: event.market,
    type: event.type,
    status: event.status,
    updatedAt: event.updatedAt,
    dv_profit: new BigNumber(event.dv_profit),
    dv_initialAmount: new BigNumber(event.dv_initialAmount),
    dv_asset: event.dv_asset,
    dv_start: moment(event.dv_start),
    dv_end: moment(event.dv_end)
    // standardActions: JSON.parse(event.standardActions).map(mapStandardAction)
  }
}

const mapStandardAction = (standardAction) => {
  return {
    type: standardAction.type,
    transferAmount: new BigNumber(standardAction.transferAmount),
    asset: standardAction.asset,
    confirmedAt: standardAction.confirmedAt
  }
}

