'use strict';

const BigNumber = require('bignumber.js')
const moment = require('moment')
const _ = require('lodash')

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

  return position.uuid
};

module.exports.addAll = async (account, positions) => {
  console.log("addAll", account, positions)

  try {
    let options = {
      "Bucket": `${process.env.tradingbucket}/dydx`,
      "Key": account
    }
    let existingPositions = []

    try {
      const data = await s3Common.s3.getObject(options).promise()
      existingPositions = JSON.parse(data.Body)
      console.log("existingPositions", existingPositions, typeof existingPositions)
    } catch (e) {
    }
    
    positions = _.unionBy(positions, existingPositions, 'uuid')

    console.log("merged", positions)

    options.Body = JSON.stringify({positions: positions})
    options.ContentType = 'application/json'

    const res = await s3Common.s3.putObject(options).promise()

    console.log("addAll success", res)

  } catch (error) {
    console.log("could not add positions", error)
  }
}

module.exports.getByOwner = async (owner) => {

  console.log("getByOwner", owner)

  // if (!s3Common.hasData(`${process.env.tradingbucket}/dydx/${owner}`)) {
  //   return []
  // }

  // const query = {
  //   sql: `SELECT ${select} FROM dydx_positions WHERE owner = '${owner}'`
  // };

  // try {
  //   const results = await s3Common.athenaExpress.query(query);
  //   if (results.Items.length > 0) {

  //     console.log("got positions", results.Items)
  //     return results.Items.map(mapPosition)
  //   } else {
  //     console.log("got no positions")
  //   }
  // } catch (error) {
  //   console.log("athena error", error);
  // }

  let options = {
    "Bucket": `${process.env.tradingbucket}/dydx`,
    "Key": owner
  }
  let positions = []

  try {
    const data = await s3Common.s3.getObject(options).promise()
    positions = JSON.parse(data.Body).positions.map(mapPosition)
    console.log("positions", positions)

  } catch (error) {
    console.log("could not get positions", error)
  }

  return positions;
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

