import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Rating from '../Rating'
import Spinner from '../Spinner'
import AddressLink from '../AddressLink'

import { 
  networkSelector,
  traderSelector,
  traderPairedSelector,
  tradesSelector,
  traderRatingsSelector
} from '../../store/selectors'
import { 
  setProfitPercentages,
  loadTraderRatings,
  loadTrades
} from '../../store/interactions'
import { ZERO_ADDRESS, displaySymbol } from '../../helpers'

class Profile extends Component {
  componentDidMount() {
    const { network, dispatch, page, section } = this.props

    console.log("page, section", page, section)
    
    loadTrades(network, section, dispatch)
    loadTraderRatings(section, network, dispatch)
  }

  render() {
    const {trader, trades, traderRatings, page, section} = this.props

    if (!traderRatings) {
      return (
        <Spinner />
      )
    }

    const tradingRatingKeys = Object.keys(traderRatings.tradingRatings.ratings)
    const profitRatingKeys = Object.keys(traderRatings.profitRatings.ratings)

    return (
      <div className="col-sm-12">
        <Container>
          <Row>
            <Col sm={2}>
              <AddressLink address={trader.user}/>
            </Col>
            <Col sm={10}>
              <h5>Trade profile - {trader.user}</h5>
            </Col>
          </Row>
        </Container>
        
        <div className="card shadow mb-4">
          <div className="card-header">
            <h4>Ratings</h4>
          </div>
          <div className="card-body">
            <div className="card shadow mb-4" key='ratings_trading'>
              <a href='#ratings_trading' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_trading'>
                <h6>Trading Ratings</h6>
              </a>
              <div id="ratings_trading" className="collapse show">
                <div className="card-body">
                  <Container>
                    <Row>
                      <Col sm={4}>
                        <Alert variant="info">
                          Trading rating is based on trade profits relative to other traders on this platform.
                        </Alert>
                      </Col>
                      <Col sm={8}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th></th><th>Rating</th><th>Average Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                          {
                            tradingRatingKeys.map((key) => {
                              return (
                                <tr key={`${key}`}>
                                  <td><h6>{displaySymbol(key)}</h6></td>
                                  <td><Rating ratingKey={`trading_${key}`} rating={traderRatings.tradingRatings.ratings[key]}/></td>
                                  <td><h6>{traderRatings.tradingRatings.formattedAverageProfits[key]}</h6></td>
                                </tr>
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
            <div className="card shadow mb-4" key='ratings_profit'>
              <a href='#ratings_profit' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_profit'>
                <h6>Profit Rating</h6>
              </a>
              <div id="ratings_profit" className="collapse show">
                <div className="card-body">
                  <Container>
                    <Row>
                      <Col sm={4}>
                        <Alert variant="info">
                          Profit rating is based on returns to investors relative to the returns of other traders
                        </Alert>
                      </Col>
                      <Col sm={8}>
                        <table className="table">
                          <thead>
                            <tr>
                              <th></th><th>Rating</th><th>Average Profit</th>
                            </tr>
                          </thead>
                          <tbody>
                          {
                            profitRatingKeys.map((key) => {
                              return (
                                <tr key={`${key}`}>
                                  <td><h6>{displaySymbol(key)}</h6></td>
                                  <td><Rating ratingKey={`profit_${key}`} rating={traderRatings.profitRatings.ratings[key]}/></td>
                                  <td><h6>{traderRatings.profitRatings.formattedAverageProfits[key]}</h6></td>
                                </tr>
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
            <div className="card shadow mb-4" key='ratings_trust'>
              <a href='#ratings_trust' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_trust'>
                <h6>Trust Rating</h6>
              </a>
              <div id="ratings_trust" className="collapse show">
                <div className="card-body">
                  <Container>
                    <Row>
                      <Col sm={4}>
                        <Alert variant="info">
                          Trust rating is based on how settlements are handled. Any suspect or fraudulent activity will impact it negatively, as well as waiting more than 48 hours to approve a settlement request
                        </Alert>
                      </Col>
                      <Col sm={8}>
                        <Row>
                          <Col sm={3}>
                            <h6>Trust</h6>
                          </Col>
                          <Col sm={9}>
                          {
                            traderRatings.trustRating
                            ? <Rating ratingKey="trust" rating={traderRatings.trustRating}/>
                            : <span>Not enough data yet. Needs at least one settlement</span>
                          }
                          </Col>
                        </Row>
                      </Col>
                    </Row>
                  </Container>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card shadow mb-4">
          <div className="card-header">
            <h4>Trades</h4>
          </div>
          <div className="card-body">
            <Container>
              <Row>
                <Col sm={12}>
                  <Alert variant="info">
                    Below are the completed trades on dydx.
                  </Alert>
                </Col>
              </Row>
              <Row>
                <Col sm={12}>
                  <div className="card shadow mb-4">
                    <a href="#WETH_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="WETH_Trades">
                      <h6 className="m-0 font-weight-bold text-primary">ETH Trades</h6>
                    </a>
                    <div id="WETH_Trades" className="collapse show">
                      <div className="card-body">
                        <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Profit</th>
                            </tr>
                          </thead>
                          { showTrades(trades["WETH"]) }
                        </table>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col sm={12}>
                  <div className="card shadow mb-4">
                    <a href="#DAI_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="DAI_Trades">
                      <h6 className="m-0 font-weight-bold text-primary">DAI Trades</h6>
                    </a>
                    <div id="DAI_Trades" className="collapse show">
                      <div className="card-body">
                        <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Profit</th>
                            </tr>
                          </thead>
                          { showTrades(trades["DAI"]) }
                        </table>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col sm={12}>
                  <div className="card shadow mb-4">
                    <a href="#USDC_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="USDC_Trades">
                      <h6 className="m-0 font-weight-bold text-primary">USDC Trades</h6>
                    </a>
                    <div id="USDC_Trades" className="collapse show">
                      <div className="card-body">
                        <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                          <thead>
                            <tr>
                              <th>Date</th>
                              <th>Profit</th>
                            </tr>
                          </thead>
                          { showTrades(trades["USDC"]) }
                        </table>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      </div>
    )
  }
}

function showTrades(trades) {
  if (trades === undefined || trades.length === 0) {
    return (
      <tbody></tbody>
    )
  }

  return (
    <tbody>
    { trades.map((trade) => {
        return (
            <tr key={trade.uuid}>
              <td className="text-muted">{trade.formattedStart}</td>
              <td className={`text-${trade.profitClass}`}>{trade.formattedProfit}</td>
            </tr>
        )
      })
    }
    </tbody>
  )
}


function mapStateToProps(state, ownProps) {
  const traderPaired = traderPairedSelector(state)

  return {
    page: ownProps.page,
    section: ownProps.section,
    network: networkSelector(state),
    traderPaired: traderPaired,
    trader: traderSelector(state, ownProps.section),
    trades: tradesSelector(state),
    traderRatings: traderRatingsSelector(state, ownProps.section)
  }
}

export default connect(mapStateToProps)(withRouter(Profile))
