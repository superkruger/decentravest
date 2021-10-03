'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../common/mysql")

const create = async (trade) => {

  console.log("creating trade", trade)

  const client = mysqlCommon.getClient()

  // id char(36) not null,
  // trader char(50) not null,
  // start INT UNSIGNED not null,
  // end INT UNSIGNED not null,
  // asset char(10) not null,
  // profit char(36) not null,
  // initialAmount char(36) not null,
  // exchange SMALLINT UNSIGNED not null,

  let resp = await client.query('INSERT INTO trades \
    (id, trader, start, end, asset, profit, initialAmount, exchange) \
    VALUES(?,?,?,?,?,?,?,?)', 
    [
      trade.id,
      trade.trader, 
      trade.start,
      trade.end,
      trade.asset,
      trade.profit,
      trade.initialAmount,
      trade.exchange
    ]);

  console.log("created trade", resp)

  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting trade", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from trades where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (trade) => {

  console.log("updating trade", trade)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE trades \
    set trader = ?, start = ?, end = ?, asset = ?, profit = ?, initialAmount = ?, exchange = ? \
    WHERE id = ?', 
    [
      trade.trader, 
      trade.start,
      trade.end,
      trade.asset,
      trade.profit,
      trade.initialAmount,
      trade.id,
      trade.exchange
    ]);

  console.log("updated trade", resp)

  return resp;
}
module.exports.update = update

const createOrUpdate = async (trade) => {

  console.log("createOrUpdate trade", trade)
  let resp

  const obj = await get(trade.id)
  if (obj) {
    resp = await update(trade)
  } else {
    resp = await create(trade)
  }

  return resp
}
module.exports.createOrUpdate = createOrUpdate

module.exports.getByTrader = async (trader) => {

  console.log("getting trades", trader)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from trades where trader = ? order by start`, [trader])
  
  return dbRes;
}

module.exports.getByTraderAndAsset = async (trader, asset) => {

  console.log("getting trades", trader)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from trades where trader = ? and asset = ? order by start`, [trader, asset])
  
  return dbRes;
}

module.exports.list = async () => {

  console.log("getting trades")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from trades`)

  return dbRes;
}

module.exports.getLastForTraderAndExchange = async (trader, exchange) => {

  console.log("getting last trade", trader)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from trades where trader = ? and exchange = ? order by start desc limit 1`, [trader, exchange])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.addAll = async (trades) => {
  console.log("addAll", trades)

  for (let i=0; i<trades.length; i++) {
    let res = await createOrUpdate(trades[i])
    if (!res) {
      return false
    }
    return true
  }

}

