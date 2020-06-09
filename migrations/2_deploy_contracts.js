const CrowdVest = artifacts.require("CrowdVest");

module.exports = async function(deployer) {
	const accounts = await web3.eth.getAccounts();
	const feeAccount = accounts[1];
	const traderFeePercent = 100;
	const investorFeePercent = 100;

  	await deployer.deploy(CrowdVest, feeAccount, traderFeePercent, investorFeePercent);
};
