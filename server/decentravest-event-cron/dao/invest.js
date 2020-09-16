'use strict';

const dbActions = require('../common/dbActions');

module.exports.create = async (event) => {

  console.log("creating invest", event)

  let client = await dbActions.client()


  let res = await client.query('INSERT INTO traderPairedInvestEvents (id, blockHash, blockNumber, investmentId, wallet, trader, investor, token, amount, investorProfitPercent, investmentType, allocationInvested, allocationTotal, date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
    [
      event.id,
      event.blockHash,
      event.blockNumber,
      event.returnValues.id,
      event.returnValues.wallet,
      event.returnValues.trader,
      event.returnValues.investor,
      event.returnValues.token,
      event.returnValues.amount,
      event.returnValues.investorProfitPercent,
      event.returnValues.investmentType,
      event.returnValues.allocationInvested,
      event.returnValues.allocationTotal,
      event.returnValues.date
    ]
  );

  console.log("created invest", res)
  client.quit()
  if (res === null) {
    console.log("could not create invest")
    return null
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting invest", id)

  let client = await dbActions.client()

  let event = {};
  let eventFromDb = await client.query(`
  select id, blockHash, blockNumber, investmentId, wallet, trader, investor, token, amount, investorProfitPercent, investmentType, allocationInvested, allocationTotal, date from traderPairedInvestEvents where id = ?`, [id])
  
  client.quit()

  if (eventFromDb.length == 0) {
    console.log("could not get invest", id)
    return null;
  }

  event.id = eventFromDb[0].id;
  event.blockHash = eventFromDb[0].blockHash;
  event.blockNumber = eventFromDb[0].blockNumber;
  event.investmentId = eventFromDb[0].investmentId;
  event.wallet = eventFromDb[0].wallet;
  event.trader = eventFromDb[0].trader;
  event.investor = eventFromDb[0].investor;
  event.token = eventFromDb[0].token;
  event.amount = eventFromDb[0].amount;
  event.investorProfitPercent = eventFromDb[0].investorProfitPercent;
  event.investmentType = eventFromDb[0].investmentType;
  event.allocationInvested = eventFromDb[0].allocationInvested;
  event.allocationTotal = eventFromDb[0].allocationTotal;
  event.date = eventFromDb[0].date;

  console.log("got invest", event)

  return event;
}

module.exports.list = async () => {

  console.log("getting invests")

  let client = await dbActions.client()

  let events = [];
  let eventsFromDb = await client.query(`
  select id, blockHash, blockNumber, investmentId, wallet, trader, investor, token, amount, investorProfitPercent, investmentType, allocationInvested, allocationTotal, date from traderPairedInvestEvents order by date desc`)
  
  client.quit()

  if (eventsFromDb.length == 0) {
    console.log("could not get invests")
    return null;
  }

  events = eventsFromDb.map(async (eventFromDb) => { 
    let event = {};
    event.id = eventFromDb[0].id;
    event.blockHash = eventFromDb[0].blockHash;
    event.blockNumber = eventFromDb[0].blockNumber;
    event.investmentId = eventFromDb[0].investmentId;
    event.wallet = eventFromDb[0].wallet;
    event.trader = eventFromDb[0].trader;
    event.investor = eventFromDb[0].investor;
    event.token = eventFromDb[0].token;
    event.amount = eventFromDb[0].amount;
    event.investorProfitPercent = eventFromDb[0].investorProfitPercent;
    event.investmentType = eventFromDb[0].investmentType;
    event.allocationInvested = eventFromDb[0].allocationInvested;
    event.allocationTotal = eventFromDb[0].allocationTotal;
    event.date = eventFromDb[0].date;
    return event;
  });
  
  console.log("got invests", events)

  return events;
}
