require('@babel/register');
require('@babel/polyfill');
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const privateKeys = process.env.PRIVATE_KEYS || ""

module.exports = {
  networks: {
    development: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 6721975,
      gasPrice: 20000000000,
      networkId: '*'
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
          privateKeys.split(','), // Array of account private keys
          `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,// Url to an Ethereum Node
          0,
          2
        )
      },
      gas: 5000000,
      gasPrice: 55000000000,
      network_id: 3
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(
          privateKeys.split(','), // Array of account private keys
          `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,// Url to an Ethereum Node
          0,
          2
        )
      },
      gas: 10000000,
      gasPrice: 25000000000,
      network_id: 1
    }
  }
};
