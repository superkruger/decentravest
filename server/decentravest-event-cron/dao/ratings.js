const s3Common = require("../common/s3Common")

module.exports.saveRatings = async (account, ratings) => {
  console.log("saveRatings", account, ratings)

  try {
    let res = await s3Common.s3.putObject({
      Bucket: `${process.env.ratingsbucket}`,
      Key: account,
      Body: JSON.stringify(ratings)
    }).promise()

    console.log("saved ratings", res)
  } catch (error) {
    console.log("could not save ratings", error)
  }
}

module.exports.getRatings = async (account) => {
  let options = {
    "Bucket": `${process.env.ratingsbucket}`,
    "Key": account
  }

  const data = await s3Common.s3.getObject(options).promise()
  return JSON.parse(data.Body)
}
