'use strict';

const dbActions = require('../common/dbActions');

module.exports.create = async (position) => {

  console.log("creating position", position)

  let client = await dbActions.client()

  let res = await client.query('INSERT INTO positions (uuid, owner) VALUES(?,?)', [position.uuid, position.owner]);
  for (let index = 0; index < position.standardActions.length; index++) {
      const sa = position.standardActions[index];
      await client.query('INSERT INTO standardActions (uuid, position_id, transferAmount, market, asset, side, confirmedAt) VALUES(?, ?, ?, ?, ?, ?)',
          [sa.uuid, position.uuid, sa.transferAmount, sa.market, sa.asset, sa.side, confirmedAt]);
  }

  console.log("created position", res)
  client.quit()
  if (res === null) {
    console.log("could not create position")
    return null
  }

  return position.uuid;
};

module.exports.get = async (id) => {

  console.log("getting position", id)

  let client = await dbActions.client()

  let position = {};
  var positionFromDb = await client.query(`
    select uuid, owner from positions where uuid = ?`, [uuid])
  if (positionFromDb.length == 0) {
      client.quit();
      return null;
  }
  var standardActionsFromDb = await client.query(`
    select uuid, transferAmount from standardActions where position_id = ?
  `, [positionFromDb[0].uuid])

  client.quit();

  position.uuid = positionFromDb[0].uuid;
  position.owner = positionFromDb[0].owner;

  if (standardActionsFromDb.length > 0) {
      position.standardActions = standardActionsFromDb.map(function (x) { return { uuid: x.uuid, transferAmount: x.transferAmount } });
  }

  console.log("got position", position)

  return position;
}

module.exports.getByOwner = async (owner) => {

  console.log("getByOwner", owner)

  let client = await dbActions.client()

  let positions = [];
  var positionsFromDb = await client.query(`
    select uuid, owner from positions where owner = ?`, [owner])
  if (positionFromDb.length == 0) {
      client.quit();
      return [];
  }

  positions = positionsFromDb.map(async (positionFromDb) => { 
    let position = {};
    let standardActionsFromDb = await client.query(`
      select uuid, transferAmount from standardActions where position_id = ?
    `, [positionFromDb[0].uuid])

    position.uuid = positionFromDb[0].uuid;
    position.owner = positionFromDb[0].owner;

    if (standardActionsFromDb.length > 0) {
        position.standardActions = standardActionsFromDb.map(function (x) { return { uuid: x.uuid, transferAmount: x.transferAmount } });
    }
    return position;
  });

  client.quit();

  console.log("got positions", positions)

  return positions;
}
