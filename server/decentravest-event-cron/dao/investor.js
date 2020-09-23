'use strict';

const AWS = require('aws-sdk'); // eslint-disable-line import/no-extraneous-dependencies
const s3 = new AWS.S3();

module.exports.create = async (event) => {

  console.log("creating investor", event, `${process.env.eventbucket}/traderpaired-investor`)

  // let client = await dbActions.client()

  // let res = await client.query('INSERT INTO traderPairedInvestorEvents (id, blockHash, blockNumber, user, investorId, date) VALUES(?,?,?,?,?,?)', 
  //   [
  //     event.id,
  //     event.blockHash,
  //     event.blockNumber,
  //     event.returnValues.user,
  //     event.returnValues.investorId,
  //     event.returnValues.date
  //   ]
  // );


  // try {
  //   let res = await s3.createBucket({Bucket: process.env.eventbucket_queryresults}).promise()
  //   console.log("created athena-results bucket", res)
  // } catch (error) {
  //   console.log("could not create athena-results bucket", error)
  // }

  // try {
  //   let res = await s3.createBucket({Bucket: process.env.eventbucket_traderpaired_investor}).promise()
  //   console.log("created investor bucket", res)
  // } catch (error) {
  //   console.log("could not create investor bucket", error)
  // }

  try {
    let res = await s3.putObject({
      Bucket: `${process.env.eventbucket}/traderpaired-investor`,
      Key: event.id,
      Body: JSON.stringify(event)
    }).promise()

    console.log("created investor", res)
  } catch (error) {
    console.log("could not create investor", error)
  }

  // client.quit()
  // if (res === null) {
  //   console.log("could not create investor")
  //   return null
  // }

  return event.id;
};

module.exports.get = async (id) => {

  console.log("getting investor", id)

  let event = {};
  
  console.log("got investor", event)

  return event;
}

module.exports.list = async () => {

  console.log("getting investors")

  let events = [];
  

  console.log("got investors", events)

  return events;
}
