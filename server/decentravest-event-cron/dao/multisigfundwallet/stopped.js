'use strict';

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.trader, \
  returnvalues.initiator, returnvalues.investmentid, returnvalues.mdate'

module.exports.create = async (walletAddress, event) => {

  console.log("creating stopped", event, `${process.env.eventbucket}/multisigfundwallet-stopped/${walletAddress}`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/multisigfundwallet-stopped/${walletAddress}`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created stopped", res)
    return true
  } catch (error) {
    console.log("could not create stopped", error)
  }

  return false
};

module.exports.get = async (walletAddress, id) => {

  console.log("getting stopped", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-stopped/${walletAddress}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_stopped WHERE id = '${id}'`
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
