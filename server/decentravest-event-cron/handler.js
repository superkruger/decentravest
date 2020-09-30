require('dotenv').config()

const interactions = require('./interactions');

module.exports.processEvents = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessEvents();
	
	return "processed events";
};

module.exports.processPositions = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localProcessPositions();

	return "processed positions";
};

module.exports.calculateRatings = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	localCalculateRatings();

	return "calculated ratings";
};

const localProcessEvents = async () => {
	let {web3, networkId} = await interactions.loadWeb3();
	console.log("loaded web3: ", web3, networkId);
	
	await interactions.processEvents(web3, networkId);
}
module.exports.localProcessEvents = localProcessEvents

const localProcessPositions = async () => {
	await interactions.processPositions();
}
module.exports.localProcessPositions = localProcessPositions

const localCalculateRatings = async () => {
	await interactions.calculateRatings();
}
module.exports.localCalculateRatings = localCalculateRatings