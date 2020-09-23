'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const s3 = new AWS.S3();

module.exports.create = async (event) => {

  console.log("creating invest", event, `${process.env.eventbucket}/traderpaired-invest`)

  // let client = await dbActions.client()


  // let res = await client.query('INSERT INTO traderPairedInvestEvents (id, blockHash, blockNumber, investmentId, wallet, trader, investor, token, amount, investorProfitPercent, investmentType, allocationInvested, allocationTotal, date) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)', 
  //   [
  //     event.id,
  //     event.blockHash,
  //     event.blockNumber,
  //     event.returnValues.id,
  //     event.returnValues.wallet,
  //     event.returnValues.trader,
  //     event.returnValues.investor,
  //     event.returnValues.token,
  //     event.returnValues.amount,
  //     event.returnValues.investorProfitPercent,
  //     event.returnValues.investmentType,
  //     event.returnValues.allocationInvested,
  //     event.returnValues.allocationTotal,
  //     event.returnValues.date
  //   ]
  // );

  // try {
  //   let res = await s3.createBucket({Bucket: process.env.eventbucket_traderpaired_invest}).promise()
  //   console.log("created invest bucket", res)
  // } catch (error) {
  //   console.log("could not create invest bucket", error)
  // }

  try {
    let res = await s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-invest`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created invest", res)
  } catch (error) {
    console.log("could not create invest", error)
  }

  // client.quit()
  // if (res === null) {
  //   console.log("could not create invest")
  //   return null
  // }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting invest", id)


  let event = {};
  

  console.log("got invest", event)

  return event;
}

module.exports.list = async () => {

  console.log("getting invests")


  let events = [];
  
  
  console.log("got invests", events)

  return events;
}
