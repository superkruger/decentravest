import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Button, Container, Row, Col, ListGroup, Tab, Alert } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  web3Selector,
  networkSelector,
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

class JoinTrader extends Component {

  componentDidMount() {
    const { account, network, dispatch } = this.props
    loadPositionsCount(network, account, dispatch)
  }

  render() {
    const { ready, positionsCount } = this.props
    return (
      <div className="content">
      {
        ready ?
        <div className="vertical-split">
          <h1>Trader registration</h1>
          <Alert variant="info">
            Traders enjoy the benefit of trading relatively risk-free, as long as your investment allocation is fully invested in, and you're not trading with more funds than you've specified.<br/>
            Any trading losses are covered by investors.<br/><br/>

            Initially, you'll only be able to receive <b>collateral</b> investments. Meaning you trade with your own funds and give a small portion (default 20%) of the profit back to investors.<br/><br/>
            Once you've built up a good trust reputation, the system will automatically allow <b>direct</b> investments. Meaning investors will pay directly into your wallet for trading purposes, of wich they get a different portion (default 80%).<br/><br/>
            The only fees you pay are a 1% fee on any profits made or collateral losses recouped.
          </Alert>
          <Tab.Container id="trader-steps" defaultActiveKey="#step1">
            <Row>
              <Col sm={4}>
                <ListGroup>
                  <ListGroup.Item action href="#step1" action variant={positionsCount > 0 ? 'success' : 'danger'}>
                    Step 1: Trading experience
                  </ListGroup.Item>
                  <ListGroup.Item action href="#step2" action>
                    Step 2: Dedicated wallet
                  </ListGroup.Item>
                  <ListGroup.Item action href="#step3" action>
                    Step 3: Register
                  </ListGroup.Item>
                </ListGroup>
              </Col>
              <Col sm={8}>
                <Tab.Content>
                  <Tab.Pane eventKey="#step1">
                      {
                        positionsCount > 0 
                        ? <p>
                            Looks like you've already got some trades under your belt.<br/><br/>
                            For now, we <strong>ONLY</strong> count Isolated Margin trades toward your score as a trader.
                          </p>
                        : <p>Before you can join as a trader, you need to have some trades on <a href="https://trade.dydx.exchange/margin/" target="_blank" rel="noopener">dydx.exchange</a></p>
                      }
                  </Tab.Pane>
                  <Tab.Pane eventKey="#step2">
                    <p>
                      It's easier if you use a <b>DEDICATED</b> wallet for this portal and trades on DYDX.<br/>
                      It's not a strict requirement, but it does prevent situations where you have a funds shortfall for investor settlements.
                    </p>
                  </Tab.Pane>
                  <Tab.Pane eventKey="#step3">
                    
                      <div className="card bg-light text-dark">
                  
                        <div className="card-body">
                          <TraderButton props={this.props} />
                        </div>
                        <div className="card-footer">
                          Register for free, and start getting investments!
                        </div>
                      </div>
                    
                  </Tab.Pane>
                </Tab.Content>
              </Col>
            </Row>
          </Tab.Container>
          
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

const traderJoin = async (props) => {
  const { network, account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history } = props

  await joinAsTrader(network, account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history)

}

function mapStateToProps(state) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
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

export default connect(mapStateToProps)(withRouter(JoinTrader))
