'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating stop", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // txHash char(60) not null,
  // investmentId BIGINT UNSIGNED not null, 
  // wallet char(50) not null,
  // trader char(50) not null,
  // investor char(50) not null,
  // stopFrom char(50) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_stop \
    (id, blockNumber, txHash, investmentId, wallet, trader, investor, stopFrom, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.transactionHash,
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.mfrom,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  // console.log("getting stop", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating stop", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_stop \
    set blockNumber = ?, txHash = ?, investmentId = ?, wallet = ?, trader = ?, investor = ?, stopFrom = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.transactionHash,
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.mfrom,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate stop", event)
  let resp

  const obj = await get(event.id)
  if (obj) {
    resp = await update(event)
  } else {
    resp = await create(event)
  }

  return resp
}

module.exports.getByInvestmentId = async (id) => {

  // console.log("getting stop", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop where investmentId = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.list = async () => {

  // console.log("getting stops")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop`)

  return dbRes;
}

module.exports.getLast = async () => {

  // console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getEventsFromBlock = async(blockNumber) => {
  // console.log("getting stops from block", blockNumber)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop WHERE blockNumber >= ? ORDER BY blockNumber`, [blockNumber])

  return dbRes;
}

module.exports.getByTrader = async (trader) => {

  // console.log("getting stops for trader", trader)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop WHERE trader = ?`, [trader])

  return dbRes;
}

module.exports.getByInvestor = async (investor) => {

  // console.log("getting stops for investor", investor)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_stop WHERE investor = ?`, [investor])

  return dbRes;
}

