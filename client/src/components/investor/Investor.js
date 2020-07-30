import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Alert } from 'react-bootstrap'
import Spinner from '../Spinner'
import {
  createWallet,
  loadMainWalletBalances
} from '../../store/interactions'
import { 
  web3Selector,
  accountSelector,
  investorSelector,
  traderPairedSelector,
  walletFactorySelector,
  walletSelector,
  walletCreatingSelector,
  tokensSelector
} from '../../store/selectors'

class Investor extends Component {
  componentDidMount() {
    const { wallet, tokens, dispatch } = this.props
    if (wallet) {
      loadMainWalletBalances(wallet.contract, tokens, dispatch)
    }
  }

  render() {
    const { wallet } = this.props

    return (
      <div>
        {
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
    <div>
      <Alert variant="info">
        In order to invest, you need to create a private multisignature wallet first.<br/>
        This ensures that your funds are safe and cannot be stolen by any party, including us!
      </Alert>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Create Wallet
      </Button>
    </div>
  )

}

function Wallet(props) {
  const { wallet } = props.props

  return (
    <div className="card shadow mb-4">
      <a href={`#wallet_${wallet.contract.options.address}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`wallet_${wallet.contract.options.address}`}>
        <h6 className="m-0 font-weight-bold text-primary">
          Your personal multisig wallet
        </h6>
      </a>
      <div className="collapse" id={`wallet_${wallet.contract.options.address}`}>
        <div className="card-body">
          <Container>
            <Row>
              <Col sm={12}>
                <span>Wallet: <a href={`https://${process.env.REACT_APP_ETHERSCAN_BASE}.etherscan.io/address/${wallet.contract.options.address}`} target="_blank" rel="noopener">{wallet.contract.options.address}</a></span>
              </Col>
            </Row>
            <Row>
              <Col sm={12}>
                <table className="table">
                  <tbody>
                    { 
                      wallet.balances.map((balance) => {
                        return (
                          <Balance balance={balance} key={balance.symbol} />
                        )
                      })
                    }
                  </tbody>
                </table>
              </Col>
            </Row>
          </Container>
        </div>
      </div>
    </div>
  )
}

function Balance(props) {
  const {balance} = props

  return (
    <tr>
      <td>
        Wallet {balance.symbol} Balance:
      </td>
      <td className="text-right">
        {balance.formatted}
      </td>
    </tr>
  )
}

function mapStateToProps(state) {

  return {
    web3: web3Selector(state),
    account: accountSelector(state),
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    walletFactory: walletFactorySelector(state),
    wallet: walletSelector(state),
    walletCreating: walletCreatingSelector(state),
    tokens: tokensSelector(state)
  }
}

export default connect(mapStateToProps)(Investor)
