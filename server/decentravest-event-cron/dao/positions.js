'use strict';


module.exports.create = async (position) => {

  console.log("creating position", position)

  try {
    let res = await s3.putObject({
      Bucket: `${process.env.eventbucket}/dydx-positions`,
      Key: position.uuid,
      Body: JSON.stringify(position)
    }).promise()

    console.log("created position", res)
  } catch (error) {
    console.log("could not create position", error)
  }

  return position.uuid;
};

module.exports.get = async (id) => {

  console.log("getting position", id)

  let position = {};
  
  console.log("got position", position)

  return position;
}

module.exports.getByOwner = async (owner) => {

  console.log("getByOwner", owner)

  let positions = [];
  
  console.log("got positions", positions)

  return positions;
}
