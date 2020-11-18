import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Button, Container, Row, Col, ListGroup, Tab, Alert, Form } from 'react-bootstrap'
import Spinner from './Spinner'
import WalletInstruction from './cards/WalletInstruction'
import {
  web3Selector,
  networkSelector,
  accountSelector, 
  traderPairedSelector,
  pairedInvestmentsSelector,
  walletFactorySelector,
  tradeCountSelector,
  joiningSelector
} from '../store/selectors'
import { 
  joinAsTrader, 
  joinAsInvestor,
  loadTradeCount
} from '../store/interactions'

import './timeline.css'

class JoinTrader extends Component {

  constructor(props) {
    super(props);

    this.state = {termsAccepted: false}
  }

  componentDidMount() {
    const { account, network, dispatch } = this.props

    if (account && network) {
      loadTradeCount(network, account, dispatch)
    }
  }

  componentDidUpdate(prevProps) {
    const { account, network, dispatch } = this.props

    if (account !== prevProps.account || network !== prevProps.network) {
      loadTradeCount(network, account, dispatch)
    }
  }

  render() {
    const { ready, tradeCount } = this.props
    return (
      <div className="content">
        {
          ready ?
            <TraderJourney props={this.props} component={this} />
          : <Spinner type="div" />
        }
      </div>
    )
  }
}

function TraderJourney(props) {
  const {component} = props
  const { tradeCount } = props.props

  return (
    <Container>
      <Row>
        <Col sm={12}>
          <div id="timeline" className="details">
            <div className="container">
              <div className="section-title">
                <h2>Trader Journey</h2>
                <p>Once you've registered as a trader, this is what your journey will look like</p>
              </div>
              <hr/>

              <div className="row content">
                <div className="col-md-12 order-1 order-md-1" data-aos="fade-up">
                  <div className="tl">
                      <div className="tl-container tl-left" data-aos="fade-right">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <i className={`fas fa-university fa-2x text-gray-300`}></i>
                            </div>
                            <div className="col-auto">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Collateral Investments</div>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                At first, you'll only be able to accept <em>collateral</em> investments. 
                                The investor's funds are kept in a multisig wallet, where you can recoup trading losses, but you'll trade with your own funds.
                                By default, you keep 80% of the profit and 20% goes to the investor.
                                To enable this, you'll need to specify <em>Collateral Limits</em> for each currency you trade with
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tl-container tl-right" data-aos="fade-left">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Build Trust</div>
                            </div>
                            <div className="col-auto">
                              <i className={`fas fa-star fa-2x text-gray-300`}></i>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                Use these collateral investments to build trust that gives you access to <em>direct</em> investments
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tl-container tl-left" data-aos="fade-right">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <i className={`fas fa-handshake fa-2x text-gray-300`}></i>
                            </div>
                            <div className="col-auto">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Direct Investments</div>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                With <em>direct</em> investments, the investor's funds are sent directly to your wallet so you can start expanding your trading capacity. 
                                By default you keep 20% of the profits, and 80% goes to the investor
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tl-container tl-right" data-aos="fade-left">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Level-up</div>
                            </div>
                            <div className="col-auto">
                              <i className={`fas fa-level-up-alt fa-2x text-gray-300`}></i>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                By getting more investments and earning a good trust rating, you earn increasingly larger investment limits, further expanding your trading capacity
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <hr/>
      <br/>
      <Row>
        <Col sm={4}>
          <Terms props={props.props} component={component} />
        </Col>
        <Col sm={8}>
          {

            tradeCount > 0 
            ? <TraderButton props={props.props} component={component} />
            : <p>Before you can join as a trader, you need to have some trades on <a href="https://trade.dydx.exchange/margin/" target="_blank" rel="noopener">dydx.exchange</a></p>
          }
        </Col>
      </Row>
    </Container>
  )
}

function Terms(props) {
  const {component} = props

  const handleChange = (event) => component.setState({termsAccepted: event.target.checked})

  const label = ( <div>I accept the <a href="https://www.decentravest.com/terms.html" target="_blank" rel="noopener">terms & conditions</a></div> )

  return (
    <Form>
      <Form.Check 
        inline
        type="checkbox"
        id="accept_terms"
        label={label}
        onChange={(e) => {handleChange(e)}}
      />
    </Form>
  )
}

function TraderButton(props) {
  const { component } = props
  const { tradeCount, joining } = props.props

  const handleClick = () => traderJoin(props.props)

  return (
    <div className="row-center">
      {
        tradeCount > 0 && component.state.termsAccepted ? 
          joining ?
            <WalletInstruction title="Confirm Joining" message="Please confirm the wallet action"/>
            :
            <Button
              className="row-center"
              variant="success"
              size="lg"
              onClick={handleClick}
              >
              Join as Trader (Just one click!)
            </Button>
        : 
          <Button
            className="row-center"
            variant="success"
            size="lg"
            disabled
            >
            Join as Trader (Just one click!)
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
    tradeCount: tradeCountSelector(state),
    joining: joiningSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(JoinTrader))
