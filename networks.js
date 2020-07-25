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
      gasPrice: 88000000000,
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
      gas: 6000000,
      gasPrice: 90000000000,
      network_id: 3
    },
    kovan: {
      provider: function() {
        return new HDWalletProvider(
          privateKeys.split(','), // Array of account private keys
          `https://kovan.infura.io/v3/${process.env.INFURA_API_KEY}`,// Url to an Ethereum Node
          0,
          2
        )
      },
      gas: 6000000,
      gasPrice: 88000000000,
      network_id: 42
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
      gas: 6721975,
      gasPrice: 88000000000,
      network_id: 1
    }
  }
};
