'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating contractInstantiation", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null,
  // blockNumber INT UNSIGNED not null, 
  // txHash char(60) not null,
  // creator char(50) not null,
  // instantiation char(50) not null,

  let resp = await client.query('INSERT INTO event_multisigfundwalletfactory_contractinstantiation \
    (id, blockNumber, txHash, creator, instantiation) \
    VALUES(?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.transactionHash,
      event.creator,
      event.instantiation
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting contractInstantiation", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwalletfactory_contractinstantiation where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating contractInstantiation", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_multisigfundwalletfactory_contractinstantiation \
    set blockNumber = ?, txHash = ?, creator = ?, instantiation = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.transactionHash,
      event.creator,
      event.instantiation,
      event.id
    ]);
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate contractInstantiation", event)
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

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwalletfactory_contractinstantiation`)

  return dbRes;
}

module.exports.getLast = async () => {

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_multisigfundwalletfactory_contractinstantiation order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

