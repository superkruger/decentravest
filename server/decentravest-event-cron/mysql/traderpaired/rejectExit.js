'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating rejectExit", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // investmentId BIGINT UNSIGNED not null, 
  // wallet char(50) not null,
  // trader char(50) not null,
  // rejectFrom char(50) not null,
  // value char(36) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_rejectexit \
    (id, blockNumber, investmentId, wallet, trader, rejectFrom, value, eventDate) \
    VALUES(?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.investmentid, 
      event.wallet,
      event.trader,
      event.mfrom,
      event.value,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  // console.log("getting rejectExit", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_rejectexit where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating rejectExit", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_rejectexit \
    set blockNumber = ?, investmentId = ?, wallet = ?, trader = ?, rejectFrom = ?, value = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.investmentid, 
      event.wallet,
      event.trader,
      event.mfrom,
      event.value,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate rejectExit", event)
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

  // console.log("getting rejectExit", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_rejectexit where investmentId = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.list = async () => {

  // console.log("getting rejectExits")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_rejectexit`)

  return dbRes;
}

module.exports.getLast = async () => {

  // console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_rejectexit order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getEventsFromBlock = async(blockNumber) => {
  // console.log("getting rejectExits from block", blockNumber)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_rejectexit WHERE blockNumber >= ? ORDER BY blockNumber`, [blockNumber])

  return dbRes;
}

module.exports.getByTrader = async (trader) => {

  // console.log("getting rejectExits for trader", trader)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_rejectexit WHERE trader = ?`, [trader])

  return dbRes;
}

