import React, { Component } from 'react'
import { connect } from 'react-redux'
import Join from './Join'
import Trader from './Trader'
import Investor from './Investor'
import './App.css'
import { 
  loadWeb3, 
  loadAccount,
  loadCrowdvest
} from '../store/interactions'
import { 
  web3Selector,
  accountSelector, 
  crowdvestSelector,
  crowdvestLoadedSelector,
  traderSelector,
  investorSelector
} from '../store/selectors'
import { web3AccountLoaded } from '../store/actions'

class App extends Component {
  componentWillMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    const web3 = loadWeb3(dispatch)
    await window.ethereum.enable();

    window.ethereum.on('accountsChanged', function (accounts) {
      dispatch(web3AccountLoaded(accounts[0]))
    })

    window.ethereum.on('chainChanged', () => {
      document.location.reload()
    })
    
    await web3.eth.net.getNetworkType()
    const networkId = await web3.eth.net.getId()
    const account = await loadAccount(web3, dispatch)
    
    const crowdvest = await loadCrowdvest(account, web3, networkId, dispatch)
    if(!crowdvest) {
      window.alert('Crowdvest smart contract not detected on the current network. Please select another network with Metamask.')
      return
    }
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          CrowdVest
          { !this.props.crowdvestLoaded ? 
            <div>connect Metamask</div> : 
            
              this.props.joined ?
              
                this.props.trader ?
                <Trader /> :
                <Investor />
               :
              <Join />
            
          }
        </header>
      </div>
    )
  }
}

function mapStateToProps(state) {
  const trader = traderSelector(state)
  const investor = investorSelector(state)
  return {
    web3: web3Selector(state),
    account: accountSelector(state),
    crowdvest: crowdvestSelector(state),
    crowdvestLoaded: crowdvestLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor
  }
}

export default connect(mapStateToProps)(App);
