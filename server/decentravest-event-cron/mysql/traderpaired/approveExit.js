'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating approveExit", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // investmentId BIGINT UNSIGNED not null, 
  // wallet char(50) not null,
  // trader char(50) not null,
  // investor char(50) not null,
  // approveFrom char(50) not null,
  // allocationInvested char(36) not null,
  // allocationTotal char(36) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_approveexit \
    (id, blockNumber, investmentId, wallet, trader, investor, approveFrom, allocationInvested, allocationTotal, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.mfrom, 
      event.allocationinvested, 
      event.allocationtotal,
      event.mdate
    ]);
  client.quit()
  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting approveExit", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_approveexit where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating approveExit", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_approveexit \
    set blockNumber = ?, investmentId = ?, wallet = ?, trader = ?, investor = ?, \
    approveFrom = ?, allocationInvested = ?, allocationTotal = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.mfrom, 
      event.allocationinvested, 
      event.allocationtotal,
      event.mdate,
      event.id
    ]);
  client.quit()
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate approveExit", event)
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

  console.log("getting approveExit", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_approveexit where investmentId = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}

module.exports.list = async () => {

  console.log("getting approveExits")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_approveexit`)

  client.quit()
  return dbRes;
}

module.exports.getLast = async () => {

  console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_approveexit order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}

module.exports.getEventsFromBlock = async(blockNumber) => {
  console.log("getting approveExits from block", blockNumber)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_approveexit WHERE blockNumber >= ? ORDER BY blockNumber`, [blockNumber])

  client.quit()
  return dbRes;
}
