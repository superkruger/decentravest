const Web3 = require("web3");
const TraderPaired = require('./abis/TraderPaired.json')

const loadWeb3 = async () => {
	let web3
	web3 = new Web3(Web3.givenProvider || 'http://127.0.0.1:8545')
	
	if (web3) {
		web3.eth.handleRevert = true
	}

	await loadWebApp(web3)

	return web3
}
exports.loadWeb3 = loadWeb3

const loadWebApp = async (web3) => {
  await web3.eth.net.getNetworkType()
  const networkId = await web3.eth.net.getId()
  console.log("networkId", networkId)
  
  const traderPaired = await loadTraderPaired(web3, networkId)
  if(!traderPaired) {
    console.log('Smart contract not detected on the current network.')
    return
  }
}

const loadTraderPaired = async (web3, networkId) => {
	try {
		if (TraderPaired.networks[networkId] !== undefined) {
			console.log("TraderPaired address: ", TraderPaired.networks[networkId].address)
			const traderPaired = await new web3.eth.Contract(TraderPaired.abi, TraderPaired.networks[networkId].address, {handleRevert: true})

			let stream = await traderPaired.getPastEvents(
				'Invest',
				{
					filter: {},
					fromBlock: 0
				}
			)
			let investments = stream.map(event => event.returnValues)
			investments.forEach(async (investment) => {
				console.log("Invest", investment)
			})

			return traderPaired
		}
	} catch (error) {
		console.log('Contract not deployed to the current network', error)
	}
	return null
}
