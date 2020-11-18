'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.id as investmentid, returnvalues.wallet, \
  returnvalues.trader, returnvalues.value, returnvalues.mfrom, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating rejectExit", event, `${process.env.eventbucket}/traderpaired-rejectexit`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-rejectexit`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created rejectExit", res)
    return true
  } catch (error) {
    console.log("could not create rejectExit", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting rejectExit", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-rejectexit`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_rejectexit WHERE id = '${id}'`
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
