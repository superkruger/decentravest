'use strict';

const encode = require('../common/encode');
const rejectExitDao = require('../dao/traderpaired/rejectExit')

module.exports.create = async (event) => {

  let id = await rejectExitDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await rejectExitDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await rejectExitDao.list();

  return events;
};

module.exports.getLast = async () => {
  let event = await rejectExitDao.getLast();

  if (event) {
    console.log("getLast rejectExit", event);
    return event;
  }

  return null;
};