// index.js
const Web3 = require("web3");
const {
  ZWeb3,
  Contracts,
  ProxyAdminProject
} = require("@openzeppelin/upgrades");
const { setupLoader } = require("@openzeppelin/contract-loader");

const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
})

const web3 = require("web3");

const ether = (n) => {
	return new web3.utils.BN(
		web3.utils.toWei(n.toString(), 'ether')
	)
}

const tokens = (n) => ether(n)

const ETHER = '0x0000000000000000000000000000000000000000'


async function main() {
	// Set up web3 object, connected to the local development network, initialize the Upgrades library
	const web3 = new Web3("http://localhost:8545");
	ZWeb3.initialize(web3.currentProvider);
	const loader = setupLoader({ provider: web3 }).web3;

	//Fetch the default account
	const deployer = await ZWeb3.defaultAccount();

	//creating a new project, to manage our upgradeable contracts.
	const project = new ProxyAdminProject("decentravest", null, null, {
		deployer
	});

	//
	// DAI Token
	//
	console.log("Deploying DAI Token")

	const DAIToken = Contracts.getFromLocal("DAIToken");
	let instance = await project.createProxy(DAIToken);
	const daiAddress = instance.options.address;
	console.log("DAI Address: ", daiAddress);

	//
	// USDC Token
	// 
	console.log("Deploying USDC Token")

	const USDCToken = Contracts.getFromLocal("USDCToken");
	instance = await project.createProxy(USDCToken);
	const usdcAddress = instance.options.address;
	console.log("USDC Address: ", usdcAddress);

	//
	// MultiSigFundWalletFactory
	//
	console.log("Deploying MultiSigFundWalletFactory")

	const MultiSigFundWalletFactory = Contracts.getFromLocal("MultiSigFundWalletFactory");
	instance = await project.createProxy(MultiSigFundWalletFactory);
	const multiSigFundWalletFactoryAddress = instance.options.address;
	console.log("MultiSigFundWalletFactory Address: ", multiSigFundWalletFactoryAddress);

	//
	// PairedInvestments
	//
	console.log("Deploying PairedInvestments")

	const PairedInvestments = Contracts.getFromLocal("PairedInvestments");
	instance = await project.createProxy(PairedInvestments);
	const pairedInvestmentsAddress = instance.options.address;
	console.log("PairedInvestments Address: ", pairedInvestmentsAddress);

	const pairedInvestments = loader.fromArtifact("PairedInvestments", pairedInvestmentsAddress);
	await pairedInvestments.methods
		.initialize(100, 100, 3000)
		.send({ from: deployer });

	//
	// TraderPaired
	//
	console.log("Deploying TraderPaired")

	const TraderPaired = Contracts.getFromLocal("TraderPaired");
	instance = await project.createProxy(TraderPaired);
	const traderPairedAddress = instance.options.address;
	console.log("TraderPaired Address: ", traderPairedAddress);

	const traderPaired = loader.fromArtifact("TraderPaired", traderPairedAddress);

	let feeAccount = await getFeeAccount()
	console.log("feeAccount", feeAccount)
	
  	await traderPaired.methods
		.initialize(feeAccount)
		.send({ from: deployer });

	console.log("initialize")

	await traderPaired.methods
		.setMultiSigFundWalletFactory(multiSigFundWalletFactoryAddress)
		.send({ from: deployer });

	console.log("setMultiSigFundWalletFactory")

	await traderPaired.methods
		.setPairedInvestments(pairedInvestmentsAddress)
		.send({ from: deployer });

	console.log("setPairedInvestments")

	await traderPaired.methods
		.setToken(ETHER, true)
		.send({ from: deployer });

	await traderPaired.methods
		.setToken(daiAddress, true)
		.send({ from: deployer });

	await traderPaired.methods
		.setToken(usdcAddress, true)
		.send({ from: deployer });

	console.log('done')
	readline.close()

}

const getFeeAccount = () => {
	return new Promise(resolve => {
    	readline.question(`Enter the fee account address: `, (fa) => {
      		resolve(fa)
    	})
  	})
}

main();
