module.exports.success = async (result) => {
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
};

module.exports.error = async (error, message) => {
  console.error(error);
  return {
    statusCode: error.statusCode || 501,
    headers: { 'Content-Type': 'text/plain' },
    body: message
  }
};