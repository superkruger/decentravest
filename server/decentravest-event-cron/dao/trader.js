'use strict';

const dbActions = require('../common/dbActions');

module.exports.create = async (event) => {

  console.log("creating trader", event)

  let client = await dbActions.client()

  let res = await client.query('INSERT INTO traderPairedTraderEvents (id, blockHash, blockNumber, user, traderId, investorCollateralProfitPercent, investorDirectProfitPercent, date) VALUES(?,?,?,?,?,?,?,?)', 
    [
      event.id, 
      event.blockHash, 
      event.blockNumber, 
      event.returnValues.user, 
      event.returnValues.traderId, 
      event.returnValues.investorCollateralProfitPercent,
      event.returnValues.investorDirectProfitPercent,
      event.returnValues.date
    ]
  );

  console.log("created trader", res)
  client.quit()
  if (res === null) {
    console.log("could not create trader")
    return null
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting trader", id)

  let client = await dbActions.client()

  let event = {};
  let eventFromDb = await client.query(`
  select id, blockHash, blockNumber, user, traderId, investorCollateralProfitPercent, investorDirectProfitPercent, date from traderPairedTraderEvents where id = ?`, [id])
  
  client.quit()

  if (eventFromDb.length == 0) {
    console.log("could not get trader", id)
    return null;
  }

  event.id = eventFromDb[0].id;
  event.blockHash = eventFromDb[0].blockHash;
  event.blockNumber = eventFromDb[0].blockNumber;
  event.user = eventFromDb[0].user;
  event.traderId = eventFromDb[0].traderId;
  event.investorCollateralProfitPercent = eventFromDb[0].investorCollateralProfitPercent;
  event.investorDirectProfitPercent = eventFromDb[0].investorDirectProfitPercent;
  event.date = eventFromDb[0].date;

  console.log("got trader", event)

  return event;
}

module.exports.list = async () => {

  console.log("getting traders")

  let client = await dbActions.client()

  console.log("client", client)

  let events = [];
  let eventsFromDb = await client.query(`
  select id, blockHash, blockNumber, user, traderId, investorCollateralProfitPercent, investorDirectProfitPercent, date from traderPairedTraderEvents order by date desc`)
  console.log("traders", eventsFromDb)
  client.quit()

  if (eventsFromDb.length == 0) {
    console.log("could not get traders")
    return [];
  }

  events = eventsFromDb.map(async (eventFromDb) => { 
    let event = {};
    event.id = eventFromDb[0].id;
    event.blockHash = eventFromDb[0].blockHash;
    event.blockNumber = eventFromDb[0].blockNumber;
    event.user = eventFromDb[0].user;
    event.traderId = eventFromDb[0].traderId;
    event.investorCollateralProfitPercent = eventFromDb[0].investorCollateralProfitPercent;
    event.investorDirectProfitPercent = eventFromDb[0].investorDirectProfitPercent;
    event.date = eventFromDb[0].date;
    return event;
  });

  console.log("got traders", events)

  return events;
}
