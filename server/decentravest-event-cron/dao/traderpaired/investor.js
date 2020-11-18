'use strict';

const s3Common = require("../../common/s3Common")
const select = 'id, blockNumber, transactionHash, returnvalues.user, returnvalues.investorid, returnvalues.mdate'

module.exports.create = async (event) => {

  console.log("creating investor", event, `${process.env.eventbucket}/traderpaired-investor`)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-investor`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created investor", res)
    return true
  } catch (error) {
    console.log("could not create investor", error)
  }

  return false
};

module.exports.get = async (id) => {

  console.log("get event", id)

  if (!s3Common.hasData(`${process.env.eventbucket}/traderpaired-investor`)) {
    return null
  }

  const query = {
    sql: `SELECT ${select} FROM traderpaired_investor where id = '${id}'`
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
