'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (walletAddress, event) => {

  console.log("creating disbursementCreated", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null,
  // blockNumber INT UNSIGNED not null, 
  // wallet char(50) not null,
  // trader char(50) not null,
  // initiator char(50) not null,
  // investmentId BIGINT UNSIGNED not null,
  // disbursementId BIGINT UNSIGNED not null,
  // value char(36) not null,
  // amount char(36) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_multisigfundwallet_disbursementcreated \
    (id, blockNumber, wallet, trader, initiator, investmentId, disbursementId, value, amount, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      walletAddress,
      event.trader,
      event.initiator,
      event.investmentid,
      event.disbursementid,
      event.value,
      event.amount,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (walletAddress, id) => {

  console.log("getting disbursementCreated", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcreated where wallet = ? and id = ?`, [walletAddress, id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (walletAddress, event) => {

  console.log("updating disbursementCreated", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_investor \
    set blockNumber = ?, wallet = ?, trader = ?, initiator = ?, investmentId = ?, \
    disbursementId = ?, value = ?, amount = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      walletAddress,
      event.trader,
      event.initiator,
      event.investmentid,
      event.disbursementid,
      event.value,
      event.amount,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (walletAddress, event) => {

  console.log("createOrUpdate disbursementCreated", event)
  let resp

  const obj = await get(walletAddress, event.id)
  if (obj) {
    resp = await update(walletAddress, event)
  } else {
    resp = await create(walletAddress, event)
  }

  return resp
}

module.exports.list = async (walletAddress) => {

  console.log("getting allocates")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcreated where wallet = ?`, [walletAddress])

  return dbRes;
}

module.exports.getLast = async (walletAddress) => {

  console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcreated where wallet = ? order by blockNumber desc limit 1`, [walletAddress])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getLastForInvestment = async (walletAddress, investmentId) => {

  console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcreated where wallet = ? and investmentId = ? order by blockNumber desc limit 1`, [walletAddress, investmentId])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

