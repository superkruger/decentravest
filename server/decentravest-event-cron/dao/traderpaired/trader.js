'use strict';

const BigNumber = require('bignumber.js');

const s3Common = require("../../common/s3Common")
const select = `id, blockNumber, transactionHash, returnvalues.user, returnvalues.traderid, \
  returnvalues.investorcollateralprofitpercent, returnvalues.investordirectprofitpercent, returnvalues.mdate`

module.exports.create = async (event) => {

  console.log("creating trader", event, `${process.env.eventbucket}/traderpaired-trader`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-trader`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created trader", res)
    return true
  } catch (error) {
    console.log("could not create trader", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("getting trader", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-trader`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_trader where id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error)
  }
  
  return null;
}
