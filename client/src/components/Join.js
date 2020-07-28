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

class Join extends Component {

  componentDidMount() {
    const { account, dispatch } = this.props
    loadPositionsCount(account, dispatch)
  }

  render() {
    const { ready, positionsCount } = this.props
    return (
      <div className="content">
      {
        ready ?
        <div className="vertical-split">
          <Jumbotron>
            <h1>Are you a Trader or an Investor?</h1>
            <p>
              Traders enjoy the benefit of trading risk-free. All your losses and trading fees are covered by Investors.
              You take away 70%* of profits.
            </p>

            <p>
              Investors enjoy the benefit of choice from a pool of the best Traders. Simply deposit funds, and 
              You take away 30%* of profits.
            </p>

            <p>
              <i>
              * Both traders and investors pay a 1% fee on any profits made.
              We don't charge a fee if no profits are made (with the exception of a 1% fee on trading losses).
              </i>
            </p>
            <Container>
              <Row>
                <Col sm={1} />
                <Col sm={4}>
                  <div className="card bg-light text-dark">
                    
                    <div className="card-body">
                      <TraderButton props={this.props} />
                    </div>
                    <div className="card-footer">
                      {
                        positionsCount > 0 ? 
                        <p>
                          Good, you've made some trades on dydx. That qualifies you to join as a Trader<br/>
                          You won't be immediately visible to investors, only once you've set allocations.
                        </p>
                        :
                        <p>Before you can join as a Trader, you have to trade on <a href="https://trade.dydx.exchange/margin/" target="_blank" rel="noopener">dydx.exchange</a></p>
                      }
                      <br/>

                      For now, we <strong>ONLY</strong> count Isolated Margin trades toward your score as a trader.<br/><br/>

                      <b>Please use a DEDICATED wallet for this portal and trades, because all profits/losses will be split amongst investors</b>
                    </div>
                  </div>
                </Col>
                <Col sm={2} />
                <Col sm={4}>
                  <div className="card bg-light text-dark">
                    
                    <div className="card-body">
                      <InvestorButton props={this.props} />
                    </div>
                    <div className="card-footer">
                      If you have ETH, DAI or USDC to invest, join here.<br/>
                      Once you've joined, you can find traders to invest in.
                    </div>
                  </div>
                </Col>
                <Col sm={1} />
              </Row>
            </Container>
          </Jumbotron>
        </div>
        : <Spinner type="div" />
      }
      </div>
    )
  }
}

function TraderButton(props) {
  const { positionsCount, traderJoining } = props.props

  const handleClick = () => traderJoin(props.props)

  return (
    <div>
      {
        positionsCount > 0 ? 
          traderJoining ?
            <Spinner />
            :
            <Button
              variant="primary"
              onClick={handleClick}
              >
              Join as Trader
            </Button>
        : 
          <Button
            variant="primary"
            onClick={handleClick}
            disabled
            >
            Join as Trader
          </Button>
      }
    </div>
  )
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

const traderJoin = async (props) => {
  const { account, traderPaired, pairedInvestments, walletFactory, web3, dispatch } = props

  await joinAsTrader(account, traderPaired, pairedInvestments, walletFactory, web3, dispatch)

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

export default connect(mapStateToProps)(Join)
