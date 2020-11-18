'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (walletAddress, event) => {

  console.log("creating disbursementCompleted", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null,
  // blockNumber INT UNSIGNED not null, 
  // txHash char(60) not null,
  // wallet char(50) not null,
  // initiator char(50) not null,
  // signedBy char(50) not null,
  // investmentId char(20) not null,
  // disbursementId char(20) not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_multisigfundwallet_disbursementcompleted \
    (id, blockNumber, txHash, wallet, initiator, signedBy, investmentId, disbursementId, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.transactionHash,
      walletAddress,
      event.initiator,
      event.signedby,
      event.investmentid,
      event.disbursementid,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (walletAddress, id) => {

  console.log("getting disbursementCompleted", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcompleted where wallet = ? and id = ?`, [walletAddress, id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (walletAddress, event) => {

  console.log("updating disbursementCompleted", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_multisigfundwallet_disbursementcompleted \
    set blockNumber = ?, txHash = ?, wallet = ?, initiator = ?, signedBy = ?, \
    investmentId = ?, disbursementId = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.transactionHash,
      walletAddress,
      event.initiator,
      event.signedby,
      event.investmentid,
      event.disbursementid,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (walletAddress, event) => {

  console.log("createOrUpdate disbursementCompleted", event)
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

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcompleted where wallet = ?`, [walletAddress])

  return dbRes;
}

module.exports.getLast = async (walletAddress) => {

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcompleted where wallet = ? order by blockNumber desc limit 1`, [walletAddress])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getLastForInvestment = async (walletAddress, investmentId) => {

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_disbursementcompleted where wallet = ? and investmentId = ? order by blockNumber desc limit 1`, [walletAddress, investmentId])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

