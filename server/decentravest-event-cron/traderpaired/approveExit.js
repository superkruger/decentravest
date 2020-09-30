'use strict';

const encode = require('../common/encode');
const approveExitDao = require('../dao/traderpaired/approveExit')

module.exports.create = async (event) => {

  let id = await approveExitDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await approveExitDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await approveExitDao.list();

  return events;
};

module.exports.getLast = async () => {
  let event = await approveExitDao.getLast();

  if (event) {
    console.log("getLast approveExit", event);
    return event;
  }

  return null;
};
