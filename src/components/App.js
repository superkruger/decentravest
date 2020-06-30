import React, { Component } from 'react'
import { connect } from 'react-redux'

import Sidebar from './Sidebar'
import Content from './Content'

import './App.css'
import { 
  loadWeb3, 
  loadAccount,
  loadTraderPaired
} from '../store/interactions'
import {
  pageSelector,
  web3Selector,
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector,
  traderSelector,
  investorSelector
} from '../store/selectors'

class App extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch)
    if (window.ethereum !== undefined) {
      await window.ethereum.enable();

      window.ethereum.on('accountsChanged', async function (accounts) {
        // await loadWebApp(web3, dispatch)
        document.location.reload()
      })

      window.ethereum.on('chainChanged', () => {
        document.location.reload()
      })

      window.ethereum.on('networkChanged', () => {
        document.location.reload()
      })
    }
    
    await loadWebApp(web3, dispatch)
  }

  render() {
    return (
      <div id="page-top">
        <div id="wrapper">
          <Sidebar />
          <Content />
        </div>
        <a className="scroll-to-top rounded" href="#page-top">
          <i className="fas fa-angle-up"></i>
        </a>
      </div>
    )
  }
}

const loadWebApp = async(web3, dispatch) => {
  await web3.eth.net.getNetworkType()
  const networkId = await web3.eth.net.getId()
  const account = await loadAccount(web3, dispatch)
  
  const traderPaired = await loadTraderPaired(account, web3, networkId, dispatch)
  if(!traderPaired) {
    console.log('Smart contract not detected on the current network. Please select another network with Metamask.')
    return
  }
}

function mapStateToProps(state) {
  const trader = traderSelector(state)
  const investor = investorSelector(state)
  return {
    page: pageSelector(state),
    web3: web3Selector(state),
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor
  }
}

export default connect(mapStateToProps)(App);
