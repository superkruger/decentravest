'use strict';

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating invest", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // investmentId BIGINT UNSIGNED not null, 
  // wallet char(50) not null,
  // trader char(50) not null,
  // investor char(50) not null,
  // token char(50) not null,
  // amount char(36) not null,
  // investorProfitPercent SMALLINT UNSIGNED not null, 
  // investmentType SMALLINT UNSIGNED not null, 
  // allocationInvested char(36) not null,
  // allocationTotal char(36) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_invest \
    (id, blockNumber, investmentId, wallet, trader, investor, token, amount, \
    investorProfitPercent, investmentType, allocationInvested, allocationTotal, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.token,
      event.amount,
      event.investorprofitpercent, 
      event.investmenttype, 
      event.allocationinvested, 
      event.allocationtotal,
      event.mdate
    ]);
  client.quit()
  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting invest", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating invest", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_invest \
    set blockNumber = ?, investmentId = ?, wallet = ?, trader = ?, investor = ?, token = ?, amount = ?, \
    investorProfitPercent = ?, investmentType = ?, allocationInvested = ?, allocationTotal = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.investmentid, 
      event.wallet,
      event.trader,
      event.investor,
      event.token,
      event.amount,
      event.investorprofitpercent, 
      event.investmenttype, 
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

  console.log("createOrUpdate invest", event)
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

  console.log("getting invest", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest where investmentId = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}

module.exports.list = async () => {

  console.log("getting invests")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest`)

  client.quit()
  return dbRes;
}

module.exports.getLast = async () => {

  console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}

module.exports.getEventsFromBlock = async(blockNumber) => {
  console.log("getting invests from block", blockNumber)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest WHERE blockNumber >= ? ORDER BY blockNumber`, [blockNumber])

  client.quit()
  return dbRes;
}

module.exports.getByTraderAndToken = async (trader, token) => {

  console.log("getting invests for trader and token", trader, token)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest WHERE trader = ? AND token = ?`, [trader, token])

  client.quit()
  return dbRes;
}

module.exports.getByTraderAndTokenBefore = async (trader, token, beforeDate) => {

  console.log("getting invests for trader before", trader, token, beforeDate)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_invest WHERE trader = ? AND token = ? AND eventDate < ?`, [trader, token, beforeDate])

  client.quit()
  return dbRes;
}
