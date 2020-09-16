'use strict';

const dbActions = require('../common/dbActions');
const encode = require('../common/encode');
const positions = require('../dydx/positions')
const traderDao = require('../dao/trader')

module.exports.create = async (event) => {

  let id = await traderDao.create(event);
  if (id === null) {
    return null
  }
  
  // add positions
  await positions.loadTraderPositions(event.returnValues.user);

  return id
}

module.exports.get = async (id) => {
  let event = await traderDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await traderDao.list();

  return events;
};

module.exports.webList = async () => {
  let events = await traderDao.list();

  return encode.success(events);
};

module.exports.getLast = async () => {
  let events = await traderDao.list();

  if (events.length > 0) {
    console.log("getLast trader", events[0]);
    return events[0];
  }

  return null;
};
