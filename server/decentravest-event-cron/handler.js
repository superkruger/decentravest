const interactions = require('./interactions');

const AWS = require("aws-sdk");
const AthenaExpress = require("athena-express");
const athenaExpressConfig = {
	aws: AWS,
	s3: `s3://${process.env.eventbucket_queryresults}`,
	db: `blockchain-events-${process.env.STAGE}`
}
const athenaExpress = new AthenaExpress(athenaExpressConfig);

module.exports.processEvents = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	_processEvents();

	
	return "processed events";
};

module.exports.processPositions = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	interactions.processPositions();

	// await interactions.calculateRatings();

	return "processed positions";
};

const _processEvents = async () => {
	let {web3, networkId} = await interactions.loadWeb3();
	console.log("loaded web3: ", web3, networkId);
	
	await interactions.processEvents(web3, networkId);
}


module.exports.queryEvents = (event, context) => {
	const time = new Date();
	console.log(`Your cron function "${context.functionName}" ran at ${time}`);

	_queryEvents();

	
	return "queried events";
};

const _queryEvents = async () => {


	let query = {
		sql: "SELECT * FROM investors_events"
	};

	try {
		let results = await athenaExpress.query(query);
		console.log("athena results", results);
	} catch (error) {
		console.log("athena error", error);
	}
}
