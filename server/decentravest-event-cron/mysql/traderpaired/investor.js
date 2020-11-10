'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating investor", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // user char(50) not null,
  // investorId INT UNSIGNED not null, 
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_investor \
    (id, blockNumber, user, investorId, eventDate) \
    VALUES(?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.user,
      event.investorid,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  // console.log("getting investor", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investor where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating investor", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_investor \
    set blockNumber = ?, user = ?, investorId = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.user,
      event.investorid,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate investor", event)
  let resp

  const obj = await get(event.id)
  if (obj) {
    resp = await update(event)
  } else {
    resp = await create(event)
  }

  return resp
}

module.exports.getByUser = async (id) => {

  // console.log("getting investor", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investor where user = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.list = async () => {

  // console.log("getting investors")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investor`)

  return dbRes;
}

module.exports.getLast = async () => {

  // console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_investor order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
