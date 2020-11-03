const s3Common = require("../common/s3Common")

module.exports.saveStatistics = async (account, statistics) => {
  console.log("saveStatistics", account, statistics)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.traderstatisticsbucket}`,
      Key: account,
      Body: JSON.stringify(statistics)
    }).promise()

    console.log("saved statistics", res)
  } catch (error) {
    console.log("could not save statistics", error)
  }
}

module.exports.getStatistics = async (account) => {
  let options = {
    "Bucket": `${process.env.traderstatisticsbucket}`,
    "Key": account
  }

  try {
    const data = await s3Common.s3.getObject(options).promise()
    return JSON.parse(data.Body)
  } catch (error) {
    console.error(`could not get statistics for ${account}`, error)
  }
  return null
}
