module.exports.success = async (result) => {
  return {
    statusCode: 200,
    headers: { 
      "Content-Type": "application/json",
      "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
    },
    body: JSON.stringify(result)
  };
};

module.exports.error = async (error, message) => {
  console.error(error);
  return {
    statusCode: error.statusCode || 501,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Headers" : "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": true, // Required for cookies, authorization headers with HTTPS
      "Access-Control-Allow-Methods": "OPTIONS,POST,GET" 
    },
    body: message
  }
};