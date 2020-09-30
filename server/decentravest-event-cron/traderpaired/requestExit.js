'use strict';

const encode = require('../common/encode');
const requestExitDao = require('../dao/traderpaired/requestExit')

module.exports.create = async (event) => {

  let id = await requestExitDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await requestExitDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await requestExitDao.list();

  return events;
};

module.exports.getLast = async () => {
  let event = await requestExitDao.getLast();

  if (event) {
    console.log("getLast requestExit", event);
    return event;
  }

  return null;
};