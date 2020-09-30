const AWS = require("aws-sdk");
const AthenaExpress = require("athena-express");

if (process.env.NODE_ENV === 'local') {
  const awsCredentials = {
    region: process.env.AWS_REGION,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
  AWS.config.update(awsCredentials);
}

const athenaExpressConfig = {
  aws: AWS,
  s3: `s3://${process.env.eventbucket_queryresults}`,
  db: `blockchain-events-${process.env.STAGE}`
}

const athenaExpress = new AthenaExpress(athenaExpressConfig);
const s3 = new AWS.S3({})

exports.athenaExpress = athenaExpress
exports.s3 = s3

module.exports.hasData = async (bucket) => {
  const params = {
        Bucket: bucket,
        MaxKeys: 1
  };

  try {
    const data = await s3.listObjectsV2(params)
    return data.Contents.length > 0
  } catch (err) {
    return false
  }
}
