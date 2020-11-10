'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating investment", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // wallet char(50) not null,
  // investor char(50) not null, 
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_investment \
    (id, blockNumber, wallet, investor, eventDate) \
    VALUES(?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.wallet,
      event.investor,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  // console.log("getting investment", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investment where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating investment", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_investment \
    set blockNumber = ?, wallet = ?, investor = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.wallet,
      event.investor,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate investment", event)
  let resp

  const obj = await get(event.id)
  if (obj) {
    resp = await update(event)
  } else {
    resp = await create(event)
  }

  return resp
}

module.exports.list = async () => {

  // console.log("getting investments")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investment`)

  return dbRes;
}

module.exports.getLast = async () => {

  // console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investment order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
