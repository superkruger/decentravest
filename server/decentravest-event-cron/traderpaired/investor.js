'use strict';

const encode = require('../common/encode');
const investorDao = require('../dao/investor')

module.exports.create = async (event) => {

  let id = await investorDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await investorDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await investorDao.list();

  return events;
};

module.exports.getLast = async () => {
  let events = await investorDao.list();

  if (events.length > 0) {
    console.log("getLast investor", events[0]);
    return events[0];
  }

  return null;
};
