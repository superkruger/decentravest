const DecentraVest = artifacts.require("DecentraVest");
const Token = artifacts.require("Token");

module.exports = async function(deployer) {
	const accounts = await web3.eth.getAccounts();
	const feeAccount = accounts[1];
	const traderFeePercent = 100;
	const investorFeePercent = 100;

	await deployer.deploy(Token);

  	await deployer.deploy(DecentraVest, feeAccount, traderFeePercent, investorFeePercent);
};
