'use strict';

const encode = require('../common/encode');
const investDao = require('../dao/traderpaired/invest')

module.exports.create = async (event) => {

  let id = await investDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await investDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await investDao.list();

  return events;
};

module.exports.getLast = async () => {
  let event = await investDao.getLast();

  if (event) {
    console.log("getLast invest", event);
    return event;
  }

  return null;
};
