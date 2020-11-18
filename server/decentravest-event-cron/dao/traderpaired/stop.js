'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.id as investmentid, returnvalues.wallet, \
  returnvalues.trader, returnvalues.investor, returnvalues.mfrom, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating stop", event, `${process.env.eventbucket}/traderpaired-stop`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-stop`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created stop", res)
    return true
  } catch (error) {
    console.log("could not create stop", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting stop", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-stop`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_stop WHERE id = '${id}'`
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
