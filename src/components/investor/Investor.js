import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import Spinner from '../Spinner'
import { etherToWei } from '../../helpers'
import { 
  loadWallet,
  createWallet
} from '../../store/interactions'
import { 
  web3Selector,
  accountSelector,
  investorSelector,
  traderPairedSelector,
  walletFactorySelector,
  walletLoadingSelector,
  walletSelector,
  walletCreatingSelector
} from '../../store/selectors'

class Investor extends Component {

  componentDidMount() {
    const { web3, account, traderPaired, walletFactory, dispatch } = this.props
    loadWallet(account, walletFactory, web3, dispatch)
  }

  render() {
    const { walletLoading, wallet } = this.props

    return (
      <div>
        { 
          walletLoading ?
            <Spinner /> :
            
              wallet ?
                <Wallet props={this.props}/> :
                <CreateWallet props={this.props}/>
            
        }
      </div>
    )
  }
}

function CreateWallet(props) {
  const { web3, account, traderPaired, walletFactory, walletCreating, dispatch } = props.props
  const handleClick = () => createWallet(account, traderPaired, walletFactory, web3, dispatch)

  return (
    walletCreating ?
    <Spinner />
    :
    <Button
      variant="primary"
      onClick={handleClick}
      >
      Create Wallet
    </Button>
  )

}

function Wallet(props) {
  const { account, wallet, investor, dispatch } = props.props

  return (
    <span>Wallet: <a href={`http://etherscan.io/address/${wallet.options.address}`} target="_blank" rel="noopener">{wallet.options.address}</a></span>
  )
}

function mapStateToProps(state) {

  return {
    web3: web3Selector(state),
    account: accountSelector(state),
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    walletFactory: walletFactorySelector(state),
    walletLoading: walletLoadingSelector(state),
    wallet: walletSelector(state),
    walletCreating: walletCreatingSelector(state)
  }
}

export default connect(mapStateToProps)(Investor)
