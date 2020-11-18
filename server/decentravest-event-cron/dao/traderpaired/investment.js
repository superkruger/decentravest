'use strict';

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.wallet, returnvalues.investor, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating investment", event, `${process.env.eventbucket}/traderpaired-investment`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-investment`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created investment", res)
    return true
  } catch (error) {
    console.log("could not create investment", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("get event", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investment`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investment where id = '${id}'`
  };

  try {
    const results = await s3Common.athenaExpress.query(query);
    if (results.Items.length > 0) {
      return results.Items[0]
    }
  } catch (error) {
    console.log("athena error", error);
  }
  
  return null;
}
