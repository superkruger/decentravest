'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (walletAddress, event) => {

  console.log("creating fund", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null,
  // blockNumber INT UNSIGNED not null,
  // txHash char(60) not null,
  // wallet char(50) not null, 
  // trader char(50) not null,
  // investor char(50) not null,
  // investmentId char(20) not null,
  // token char(50) not null,
  // amount char(36) not null,
  // investmentType SMALLINT UNSIGNED not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_multisigfundwallet_fund \
    (id, blockNumber, txHash, wallet, trader, investor, investmentId, token, amount, investmentType, eventDate) \
    VALUES(?,?,?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.transactionHash,
      walletAddress,
      event.trader,
      event.investor,
      event.investmentid,
      event.token,
      event.amount,
      event.investmenttype,
      event.mdate
    ]);
  return resp;
}
module.exports.create = create

const get = async (walletAddress, id) => {

  console.log("getting fund", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_fund where wallet = ? and id = ?`, [walletAddress, id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (walletAddress, event) => {

  console.log("updating fund", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_multisigfundwallet_fund \
    set blockNumber = ?, txHash = ?, wallet = ?, trader = ?, investor = ?, investmentId = ?, \
    token = ?, amount = ?, investmentType = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.transactionHash,
      walletAddress,
      event.trader,
      event.investor,
      event.investmentid,
      event.token,
      event.amount,
      event.investmenttype,
      event.mdate,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (walletAddress, event) => {

  console.log("createOrUpdate fund", event)
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

  let dbRes = await client.query(`select * from event_multisigfundwallet_fund where wallet = ?`, [walletAddress])

  return dbRes;
}

module.exports.getLast = async (walletAddress) => {

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_fund where wallet = ? order by blockNumber desc limit 1`, [walletAddress])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getLastForInvestment = async (walletAddress, investmentId) => {

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwallet_fund where wallet = ? and investmentId = ? order by blockNumber desc limit 1`, [walletAddress, investmentId])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

