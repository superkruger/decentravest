'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.id as investmentid, returnvalues.wallet, returnvalues.trader, returnvalues.investor, \
  returnvalues.mfrom, returnvalues.value, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating requestExit", event, `${process.env.eventbucket}/traderpaired-requestexit`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-requestexit`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created requestExit", res)
    return true
  } catch (error) {
    console.log("could not create requestExit", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting requestExit", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-requestexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_requestexit WHERE id = '${id}'`
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
