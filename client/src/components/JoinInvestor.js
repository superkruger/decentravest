import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Button, Container, Row, Col, Alert } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  web3Selector,
  accountSelector, 
  traderPairedSelector,
  pairedInvestmentsSelector,
  walletFactorySelector,
  investorJoiningSelector
} from '../store/selectors'
import { 
  joinAsTrader, 
  joinAsInvestor 
} from '../store/interactions'

class JoinInvestor extends Component {

  componentDidMount() {
    const { account, dispatch } = this.props
  }

  render() {
    const { ready } = this.props
    return (
      <div>
      {
        ready ?
        <div className="vertical-split">
          <h1>Investor registration</h1>
          <Alert variant="info">
            Investors enjoy the benefit of choice between traders, based of performance and reputation<br/><br/>
            You can choose between <b>collateral</b> and <b>direct</b> investments.<br/><br/>
            The only fees you pay are a 1% fee on any profits made.
          </Alert>
          <div className="card bg-light text-dark">
      
            <div className="card-body">
              <InvestorButton props={this.props} />
            </div>
            <div className="card-footer">
              If you have ETH, DAI or USDC to invest, join here.<br/>
              Once you've joined, you can find traders to invest in.
            </div>
          </div>
                    
        </div>
        : <Spinner type="div" />
      }
      </div>
    )
  }
}

function InvestorButton(props) {
  const { investorJoining } = props.props
  const handleClick = () => investorJoin(props.props)

  return (
    investorJoining ?
    <Spinner />
    :
    <Button
      variant="primary"
      onClick={handleClick}
      >
      Join as Investor
    </Button>
  )
}

const investorJoin = async (props) => {
  const { account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history } = props

  await joinAsInvestor(account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history)

}

function mapStateToProps(state) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    web3: web3Selector(state),
    account: account,
    traderPaired: traderPaired,
    pairedInvestments: pairedInvestmentsSelector(state),
    walletFactory: walletFactorySelector(state),
    ready: account && traderPaired,
    investorJoining: investorJoiningSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(JoinInvestor))
