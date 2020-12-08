const s3Common = require("../common/s3Common")

module.exports.saveStatistics = async (statistics) => {
  console.log("saveStatistics", statistics)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.statisticsbucket}/public`,
      Key: 'public',
      Body: JSON.stringify(statistics)
    }).promise()

    console.log("saved statistics", res)
    return true
  } catch (error) {
    console.log("could not save statistics", error)
  }
  return false
}

module.exports.getStatistics = async () => {
  let options = {
    "Bucket": `${process.env.statisticsbucket}/public`,
    "Key": 'public'
  }

  try {
    const data = await s3Common.s3.getObject(options).promise()
    return JSON.parse(data.Body)
  } catch (error) {
    console.error(`could not get statistics`, error)
  }
  return null
}
