'use strict';

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.trader, returnvalues.investor, \
  returnvalues.investmentid, returnvalues.token, returnvalues.amount, returnvalues.investmenttype, returnvalues.mdate'

module.exports.create = async (walletAddress, event) => {

  console.log("creating fund", event, `${process.env.eventbucket}/multisigfundwallet-fund/${walletAddress}`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/multisigfundwallet-fund/${walletAddress}`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created fund", res)
    return true
  } catch (error) {
    console.log("could not create fund", error)
  }

  return false
};

module.exports.get = async (walletAddress, id) => {

  console.log("getting fund", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/multisigfundwallet-fund/${walletAddress}`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM multisigfundwallet_fund WHERE id = '${id}'`
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
