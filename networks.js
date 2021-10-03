require('@babel/register');
require('@babel/polyfill');
require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');

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
    rinkeby: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATE_KEYS_ROPSTEN.split(','), // Array of account private keys
          `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,// Url to an Ethereum Node
          0,
          2
        )
      },
      gas: 7000000,
      gasPrice: 50000000000,
      network_id: 4
    },
    ropsten: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATE_KEYS_ROPSTEN.split(','), // Array of account private keys
          `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,// Url to an Ethereum Node
          0,
          2
        )
      },
      gas: 7000000,
      gasPrice: 200000000000,
      network_id: 3
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider(
          process.env.PRIVATE_KEYS_MAINNET.split(','), // Array of account private keys
          `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,// Url to an Ethereum Node
          0,
          2
        )
      },
      gas: 4200000,
      gasPrice: 70000000000,
      network_id: 1
    }
  },
  mocha: {
    reporter: 'eth-gas-reporter'
  }
};
