'use strict';

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.creator, returnvalues.instantiation'

module.exports.create = async (event) => {

  console.log("creating contractInstantiation", event, `${process.env.eventbucket}/multisigfundwalletfactory-contractinstantiation`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/multisigfundwalletfactory-contractinstantiation`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created contractInstantiation", res)
    return true
  } catch (error) {
    console.log("could not create contractInstantiation", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting contractInstantiation", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwalletfactory-contractinstantiation`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwalletfactory_contractinstantiation WHERE id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {

      console.log("got event", results.Items[0])
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}
