'use strict';

const dbActions = require('../common/dbActions');

module.exports.create = async (event) => {

  console.log("creating investor", event)

  let client = await dbActions.client()

  let res = await client.query('INSERT INTO traderPairedInvestorEvents (id, blockHash, blockNumber, user, investorId, date) VALUES(?,?,?,?,?,?)', 
    [
      event.id,
      event.blockHash,
      event.blockNumber,
      event.returnValues.user,
      event.returnValues.investorId,
      event.returnValues.date
    ]
  );

  console.log("created investor", res)
  client.quit()
  if (res === null) {
    console.log("could not create investor")
    return null
  }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting investor", id)

  let client = await dbActions.client()

  let event = {};
  let eventFromDb = await client.query(`
  select id, blockHash, blockNumber, user, investorId, date from traderPairedInvestorEvents where id = ?`, [id])
  
  client.quit()

  if (eventFromDb.length == 0) {
    console.log("could not get investor", id)
    return null;
  }

  event.id = eventFromDb[0].id;
  event.blockHash = eventFromDb[0].blockHash;
  event.blockNumber = eventFromDb[0].blockNumber;
  event.user = eventFromDb[0].user;
  event.investorId = eventFromDb[0].investorId;
  event.date = eventFromDb[0].date;

  console.log("got investor", event)

  return event;
}

module.exports.list = async () => {

  console.log("getting investors")

  let client = await dbActions.client()

  let events = [];
  let eventsFromDb = await client.query(`
  select id, blockHash, blockNumber, user, investorId, date from traderPairedInvestorEvents order by date desc`)
  
  client.quit()

  if (eventsFromDb.length == 0) {
    console.log("could not get investors")
    return [];
  }

  events = eventsFromDb.map(async (eventFromDb) => { 
    let event = {};
    event.id = eventFromDb[0].id;
    event.blockHash = eventFromDb[0].blockHash;
    event.blockNumber = eventFromDb[0].blockNumber;
    event.user = eventFromDb[0].user;
    event.investorId = eventFromDb[0].investorId;
    event.date = eventFromDb[0].date;
    return event;
  });

  console.log("got investors", events)

  return events;
}
