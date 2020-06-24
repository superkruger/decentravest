import React, { Component } from 'react'
import { connect } from 'react-redux'
import Header from './Header'
import Footer from './Footer'
import Intro from './Intro'
import Join from './Join'
import Trader from './Trader'
import Investor from './Investor'
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
import { web3AccountLoaded } from '../store/actions'

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
      <div className="content">
        <Header />
        {
          {
            'home': <Intro />,
            'join': <Join />,
            'trader': <Trader />,
            'investor': <Investor />
          }[this.props.page]
        }
        <Footer />
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
