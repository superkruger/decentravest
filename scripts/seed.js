// Contracts
const CrowdVest = artifacts.require("CrowdVest")

// Utils

const ether = (n) => {
  return new web3.utils.BN(
    web3.utils.toWei(n.toString(), 'ether')
  )
}

const wait = (seconds) => {
  const milliseconds = seconds * 1000
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const seed = async (accounts, platform) => {

    const trader = accounts[2]
    const investor = accounts[3]

    await platform.joinAsTrader(2500, {from: trader})
    await platform.joinAsInvestor({from: investor})

    await platform.deposit({from: investor, value: ether(1)})
}

module.exports = async function(callback) {
  try {
    // Fetch accounts from wallet - these are unlocked
    const accounts = await web3.eth.getAccounts()

    // Fetch the deployed platform
    const platform = await CrowdVest.deployed()
    console.log('Platform fetched', platform.address)

    await seed(accounts, platform)

  }
  catch(error) {
    console.log(error)
  }

  callback()
}
