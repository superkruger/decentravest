'use strict';


const mysqlCommon = require("../common/mysql")

const helpers = require('../helpers')

const create = async (investment) => {

  // id BIGINT UNSIGNED not null,
  // investBlockNumber INT UNSIGNED not null, 
  // stopBlockNumber INT UNSIGNED not null, 
  // requestBlockNumber INT UNSIGNED not null, 
  // rejectBlockNumber INT UNSIGNED not null, 
  // approveBlockNumber INT UNSIGNED not null, 
  // disbursementId BIGINT UNSIGNED not null,
  // wallet char(50) not null,
  // trader char(50) not null,
  // investor char(50) not null,
  // token char(50) not null,
  // amount char(36) not null,
  // value char(36) not null,
  // grossValue char(36) not null,
  // nettValue char(36) not null,
  // investorProfitPercent SMALLINT UNSIGNED not null,
  // investmentType SMALLINT UNSIGNED not null,
  // state SMALLINT UNSIGNED not null,
  // traderLimit char(36) not null,
  // startDate INT UNSIGNED not null,
  // endDate INT UNSIGNED not null,

  console.log("creating investment", investment)

  const client = mysqlCommon.getClient()

  let resp = await client.query('INSERT INTO investments \
    (id, investBlockNumber, stopBlockNumber, requestBlockNumber, rejectBlockNumber, approveBlockNumber, \
      disbursementId, wallet, trader, investor, token, amount, value, \
      grossValue, nettValue, investorProfitPercent, investmentType, state, traderLimit, startDate, endDate) \
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
    [
      investment.id, 
      investment.investBlockNumber, 
      investment.stopBlockNumber, 
      investment.requestBlockNumber, 
      investment.rejectBlockNumber, 
      investment.approveBlockNumber, 
      investment.disbursementId, 
      investment.wallet, 
      investment.trader, 
      investment.investor, 
      investment.token, 
      investment.amount, 
      investment.value, 
      investment.grossValue, 
      investment.nettValue, 
      investment.investorProfitPercent, 
      investment.investmentType, 
      investment.state, 
      investment.traderLimit, 
      investment.startDate, 
      investment.endDate
    ]);
  return resp;
}
module.exports.create = create

const get = async (id) => {

  console.log("getting investment", id)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments where id = ?`, [id])
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}
module.exports.get = get

module.exports.update = async (investment) => {

  console.log("updating investment", investment)

  const client = mysqlCommon.getClient()

  let resp = await client.query('UPDATE investments \
    set investBlockNumber = ?, stopBlockNumber = ?, requestBlockNumber = ?, rejectBlockNumber = ?, \
      approveBlockNumber = ?, disbursementId = ?, wallet = ?, trader = ?, investor = ?, token = ?, amount = ?, \
      value = ?, grossValue = ?, nettValue = ?, investorProfitPercent = ?, investmentType = ?, \
      state = ?, traderLimit = ?, startDate = ?, endDate = ? \
    WHERE id = ?', 
    [
      investment.investBlockNumber, 
      investment.stopBlockNumber, 
      investment.requestBlockNumber, 
      investment.rejectBlockNumber, 
      investment.approveBlockNumber, 
      investment.disbursementId, 
      investment.wallet, 
      investment.trader, 
      investment.investor, 
      investment.token, 
      investment.amount, 
      investment.value, 
      investment.grossValue, 
      investment.nettValue, 
      investment.investorProfitPercent, 
      investment.investmentType, 
      investment.state, 
      investment.traderLimit, 
      investment.startDate, 
      investment.endDate,
      investment.id
    ]);
  return resp;
}

module.exports.createOrUpdate = async (investment) => {

  console.log("createOrUpdate investment", investment)
  let resp

  const obj = await get(investment.id)
  if (obj) {
    resp = await update(investment)
  } else {
    resp = await create(investment)
  }

  return resp
};

module.exports.listActive = async () => {

  console.log("getting active investments")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments where state != ${helpers.INVESTMENT_STATE_EXITAPPROVED} order by startDate desc`)

  return dbRes;
}

module.exports.getInvestLast = async () => {

  console.log("getting InvestLast investment")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments ORDER BY investBlockNumber desc LIMIT 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getStopLast = async () => {

  console.log("getting StopLast investment")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments ORDER BY stopBlockNumber desc LIMIT 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getRequestLast = async () => {

  console.log("getting RequestLast investment")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments ORDER BY requestBlockNumber desc LIMIT 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getRejectLast = async () => {

  console.log("getting RejectLast investment")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments ORDER BY rejectBlockNumber desc LIMIT 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getApproveLast = async () => {

  console.log("getting RejectLast investment")

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments ORDER BY approveBlockNumber desc LIMIT 1`)
  if (dbRes.length == 0) {
      return null;
  }
  
  let resp = dbRes[0]

  return resp;
}

module.exports.getByTrader = async (account) => {

  console.log("getting investments for trader", account)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments where trader = ? order by startDate desc`, [account])

  return dbRes;
}

module.exports.getByInvestor = async (account) => {

  console.log("getting investments for investor", account)

  const client = mysqlCommon.getClient()

  let dbRes = await client.query(`select * from investments where investor = ? order by startDate desc`, [account])

  return dbRes;
}

