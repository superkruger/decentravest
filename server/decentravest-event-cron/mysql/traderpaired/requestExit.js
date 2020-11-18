'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating requestExit", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // txHash char(60) not null,
  // investmentId BIGINT UNSIGNED not null, 
  // wallet char(50) not null,
  // trader char(50) not null,
  // investor char(50) not null,
  // requestFrom char(50) not null,
  // value char(36) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_requestexit \
    (id, blockNumber, txHash, investmentId, wallet, trader, investor, requestFrom, value, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.transactionHash,
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.mfrom,
      event.value,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting requestExit", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating requestExit", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_requestexit \
    set blockNumber = ?, txHash = ?, investmentId = ?, wallet = ?, trader = ?, investor = ?, requestFrom = ?, value = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.transactionHash,
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.mfrom,
      event.value,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate requestExit", event)
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

  // console.log("getting requestExit", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit where investmentId = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.list = async () => {

  // console.log("getting requestExits")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit`)

  return dbRes;
}

module.exports.getLast = async () => {

  // console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getEventsFromBlock = async(blockNumber) => {
  // console.log("getting requestExits from block", blockNumber)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit WHERE blockNumber >= ? ORDER BY blockNumber`, [blockNumber])

  return dbRes;
}

module.exports.getByTrader = async (trader) => {

  // console.log("getting requestExits for trader", trader)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit WHERE trader = ?`, [trader])

  return dbRes;
}

module.exports.getByInvestor = async (investor) => {

  // console.log("getting requestExits for investor", investor)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_requestexit WHERE investor = ?`, [investor])

  return dbRes;
}

