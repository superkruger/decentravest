'use strict';

const encode = require('../common/encode');
const allocateDao = require('../dao/traderpaired/allocate')

module.exports.create = async (event) => {

  let id = await allocateDao.create(event);
  if (id === null) {
    return null
  }
  return id
}

module.exports.get = async (id) => {
  let event = await allocateDao.get(id);

  return event;
}

module.exports.list = async () => {
  let events = await allocateDao.list();

  return events;
};

module.exports.getLast = async () => {
  let event = await allocateDao.getLast();

  if (event) {
    console.log("getLast allocate", event);
    return event;
  }

  return null;
};
