'use strict';

const encode = require('../common/encode');
const investorDao = require('../dao/traderpaired/investor')

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
  let event = await investorDao.getLast();

  if (event) {
    console.log("getLast investor", event);
    return event;
  }

  return null;
};
