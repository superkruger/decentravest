const interactions = require('./interactions');

module.exports.processEvents = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	let {web3, networkId} = interactions.loadWeb3();
	console.log("loaded web3: ", web3, networkId);

	interactions.processEvents(web3, networkId);
	return "processed events";
};

module.exports.processPositions = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	interactions.processPositions();

	// await interactions.calculateRatings();

	return "processed positions";
};
