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
  investorSelector,
  sidebarClosedSelector
} from '../store/selectors'

class App extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = await loadWeb3(dispatch)
    
    await loadWebApp(web3, dispatch)
  }

  render() {
    const { sidebarClosed } = this.props

    return (
      <div id="page-top" className={ sidebarClosed ? 'sidebar-toggled' : ''}>
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
  console.log("NI", networkId)
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
    investor: investor,
    sidebarClosed: sidebarClosedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
