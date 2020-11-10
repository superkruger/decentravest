'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating allocate", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // trader char(50) not null,
  // token char(50) not null,
  // total char(36) not null, 
  // invested varchar(36) not null, 
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_allocate \
    (id, blockNumber, trader, token, total, invested, eventDate) \
    VALUES(?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.trader,
      event.token,
      event.total,
      event.invested,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  // console.log("getting allocate", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_allocate where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating allocate", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_allocate \
    set blockNumber = ?, trader = ?, token = ?, total = ?, invested = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.trader,
      event.token,
      event.total,
      event.invested,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate allocate", event)
  let resp

  const obj = await get(event.id)
  if (obj) {
    resp = await update(event)
  } else {
    resp = await create(event)
  }

  return resp
}

module.exports.getByTraderAndToken = async (trader, token) => {

  // console.log("getting allocate", trader, token)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_allocate where trader = ? and token = ? ORDER by eventDate desc`, [trader, token])

  return dbRes;
}

module.exports.list = async () => {

  // console.log("getting allocates")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_allocate`)

  return dbRes;
}

module.exports.getLast = async () => {

  // console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_allocate order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}


