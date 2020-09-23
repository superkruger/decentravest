'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const s3 = new AWS.S3();

module.exports.create = async (event) => {

  console.log("creating trader", event, `${process.env.eventbucket}/traderpaired-trader`)

  // let client = await dbActions.client()

  // let res = await client.query('INSERT INTO traderPairedTraderEvents (id, blockHash, blockNumber, user, traderId, investorCollateralProfitPercent, investorDirectProfitPercent, date) VALUES(?,?,?,?,?,?,?,?)', 
  //   [
  //     event.id, 
  //     event.blockHash, 
  //     event.blockNumber, 
  //     event.returnValues.user, 
  //     event.returnValues.traderId, 
  //     event.returnValues.investorCollateralProfitPercent,
  //     event.returnValues.investorDirectProfitPercent,
  //     event.returnValues.date
  //   ]
  // );

  // try {
  //   let res = await s3.createBucket({Bucket: process.env.eventbucket_traderpaired_trader}).promise()
  //   console.log("created trader bucket", res)
  // } catch (error) {
  //   console.log("could not create trader bucket", error)
  // }

  try {
    let res = await s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-trader`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created trader", res)
  } catch (error) {
    console.log("could not create trader", error)
  }

  // client.quit()
  // if (res === null) {
  //   console.log("could not create trader")
  //   return null
  // }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting trader", id)

  let event = {};
  
  console.log("got trader", event)

  return event;
}

module.exports.list = async () => {

  console.log("getting traders")

  let events = [];
  

  console.log("got traders", events)

  return events;
}
