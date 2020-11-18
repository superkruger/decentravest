'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.id as investmentid, returnvalues.wallet, returnvalues.trader, returnvalues.investor, returnvalues.token, \
    returnvalues.amount, returnvalues.investorprofitpercent, returnvalues.investmenttype, \
    returnvalues.allocationinvested, returnvalues.allocationtotal, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating invest", event, `${process.env.eventbucket}/traderpaired-invest`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-invest`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created invest", res)
    return true
  } catch (error) {
    console.log("could not create invest", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting invest", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-invest`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_invest WHERE id = '${id}'`
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
