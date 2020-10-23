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
  tradeCountSelector,
  traderJoiningSelector
} from '../store/selectors'
import { 
  joinAsTrader, 
  joinAsInvestor,
  loadTradeCount
} from '../store/interactions'

import './timeline.css'

class JoinTrader extends Component {

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
            <TraderJourney props={this.props} />
          : <Spinner type="div" />
        }
      </div>
    )
  }
}

function TraderJourney(props) {
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
                                The funds are kept in a multisig wallet, where you can recoup trading losses, but you'll trade with your own funds.
                                To enable this, you'll need to specify <em>Allocations</em> for each currency you trade with.
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
                                With <em>direct</em> investments, you get full access to the investment funds and can start expanding your trading capacity
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
                                By getting more investments and earning a good trust rating, you earn increasingly larger investment thresholds, further expanding your trading capacity
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
        <Col sm={12}>
          {

            tradeCount > 0 
            ? <TraderButton props={props.props} />
            : <p>Before you can join as a trader, you need to have some trades on <a href="https://trade.dydx.exchange/margin/" target="_blank" rel="noopener">dydx.exchange</a></p>
          }
        </Col>
      </Row>
    </Container>
  )
}

function TraderButton(props) {
  const { tradeCount, traderJoining } = props.props

  const handleClick = () => traderJoin(props.props)

  return (
    <div className="row-center">
      {
        tradeCount > 0 ? 
          traderJoining ?
            <Spinner />
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
            variant="success"
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
    tradeCount: tradeCountSelector(state),
    traderJoining: traderJoiningSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(JoinTrader))
