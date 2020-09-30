'use strict';

const encode = require('../common/encode');
const stopDao = require('../dao/traderpaired/stop')

module.exports.create = async (event) => {

  let id = await stopDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await stopDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await stopDao.list();

  return events;
};

module.exports.getLast = async () => {
  let event = await stopDao.getLast();

  if (event) {
    console.log("getLast stop", event);
    return event;
  }

  return null;
};
