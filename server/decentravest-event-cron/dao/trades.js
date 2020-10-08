const s3Common = require("../common/s3Common")
const _ = require('lodash')

module.exports.addAll = async (account, trades) => {
  console.log("addAll", account, trades)

  try {
    let options = {
      "Bucket": `${process.env.tradingbucket}`,
      "Key": account
    }
    let existingTrades = []

    try {
      const data = await s3Common.s3.getObject(options).promise()
      existingTrades = JSON.parse(data.Body).trades

      console.log("existingTrades", existingTrades)
    } catch (e) {
      console.log("error", e)
    }
    
    trades = _.unionBy(trades, existingTrades, 'uuid')

    console.log("merged", trades)

    options.Body = JSON.stringify({trades: trades})
    options.ContentType = 'application/json'

    const res = await s3Common.s3.putObject(options).promise()

    console.log("addAll success", res)

  } catch (error) {
    console.log("could not add trades", error)
  }
}

module.exports.getTrades = async (account) => {
  let options = {
    "Bucket": `${process.env.tradingbucket}`,
    "Key": account
  }

  const data = await s3Common.s3.getObject(options).promise()
  return JSON.parse(data.Body)
}
