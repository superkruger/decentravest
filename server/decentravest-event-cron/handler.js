
const interactions = require('./interactions');

module.exports.processEvents = (event, context) => {
  const time = new Date();
  console.log(`Your cron function "${context.functionName}" ran at ${time}`);

  interactions.loadWeb3();
  return "processed events";
};

// const processEvents = async () => {
// 	console.log('INFURA_BASE_URL: ', process.env.INFURA_BASE_URL);
// 	console.log('INFURA_API_KEY: ', process.env.INFURA_API_KEY);
// 	interactions.loadWeb3()
// 	return "we did it";
// };

// module.exports = {
// 	processEvents,
// };
