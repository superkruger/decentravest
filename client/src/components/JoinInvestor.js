import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Jumbotron, Button, Container, Row, Col } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  web3Selector,
  accountSelector, 
  traderPairedSelector,
  pairedInvestmentsSelector,
  walletFactorySelector,
  positionsCountSelector,
  traderJoiningSelector,
  investorJoiningSelector
} from '../store/selectors'
import { 
  joinAsTrader, 
  joinAsInvestor 
} from '../store/interactions'
import { 
  loadPositionsCount
} from '../store/dydxInteractions'

class JoinInvestor extends Component {

  componentDidMount() {
    const { account, dispatch } = this.props
    loadPositionsCount(account, dispatch)
  }

  render() {
    const { ready, positionsCount } = this.props
    return (
      <div>
      {
        ready ?
        <div className="vertical-split">
          <h1>Investor registration</h1>
          <p>
            Investors enjoy the benefit of choice between traders, based of performance and reputation<br/><br/>
            You can choose between <b>collateral</b> and <b>direct</b> investments.<br/><br/>
            The only fees you pay are a 1% fee on any profits made.
          </p>
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
  const { account, traderPaired, pairedInvestments, walletFactory, web3, dispatch } = props

  await joinAsInvestor(account, traderPaired, pairedInvestments, walletFactory, web3, dispatch)

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
    positionsCount: positionsCountSelector(state),
    traderJoining: traderJoiningSelector(state),
    investorJoining: investorJoiningSelector(state)
  }
}

export default connect(mapStateToProps)(JoinInvestor)
