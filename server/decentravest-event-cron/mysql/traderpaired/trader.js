'use strict';

const BigNumber = require('bignumber.js');

const mysqlCommon = require("../../common/mysql")

const create = async (event) => {

  console.log("creating trader", event)

  const client = mysqlCommon.getClient()

  // id char(36) not null
  // blockNumber INT UNSIGNED not null, 
  // user char(50) not null,
  // traderId INT UNSIGNED not null, 
  // investorCollateralProfitPercent SMALLINT UNSIGNED not null, 
  // investorDirectProfitPercent SMALLINT UNSIGNED not null,
  // eventDate INT UNSIGNED not null,

  let resp = await client.query('INSERT INTO event_traderpaired_trader \
    (id, blockNumber, user, traderId, investorCollateralProfitPercent, investorDirectProfitPercent, eventDate) \
    VALUES(?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockNumber, 
      event.user,
      event.traderid,
      event.investorcollateralprofitpercent,
      event.investordirectprofitpercent,
      event.mdate
    ]);
  client.quit()
  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting trader", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_trader where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}
module.exports.get = get

const update = async (event) => {

  console.log("updating trader", event)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE event_traderpaired_trader \
    set blockNumber = ?, user = ?, traderId = ?, investorCollateralProfitPercent = ?, \
    investorDirectProfitPercent = ?, eventDate = ? \
    WHERE id = ?', 
    [
      event.blockNumber, 
      event.user,
      event.traderid,
      event.investorcollateralprofitpercent,
      event.investordirectprofitpercent,
      event.mdate,
      event.id
    ]);
  client.quit()
  return resp;
}
module.exports.update = update

module.exports.createOrUpdate = async (event) => {

  console.log("createOrUpdate trader", event)
  let resp

  const obj = await get(event.id)
  if (obj) {
    resp = await update(event)
  } else {
    resp = await create(event)
  }

  return resp
};

module.exports.getByUser = async (id) => {

  console.log("getting trader", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_trader where user = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}

module.exports.list = async () => {

  console.log("getting traders")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_trader`)

  client.quit()
  return dbRes;
}

module.exports.getLast = async () => {

  console.log("getting last event")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from event_traderpaired_trader order by blockNumber desc limit 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  client.quit()
  return resp;
}


