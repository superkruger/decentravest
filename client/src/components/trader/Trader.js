import moment from 'moment'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Rating from '../Rating'
import Spinner from '../Spinner'
import Level from '../cards/Level'
import ExplodingPieChart from '../cards/ExplodingPieChart'
import DateLineChart from '../cards/DateLineChart'

import { 
  networkSelector,
  accountSelector, 
  traderSelector,
  traderPairedSelector,
  tradersSelector,
  tradesSelector,
  traderStatisticsSelector
} from '../../store/selectors'
import { 
  loadTraderStatistics,
  loadTrades
} from '../../store/interactions'
import { ZERO_ADDRESS, displaySymbol } from '../../helpers'

class Trader extends Component {
  componentDidMount() {
    const { network, account, dispatch } = this.props
    
    loadTrades(network, account, dispatch)
    loadTraderStatistics(account, network, dispatch)
  }

  render() {
    const {traderStatistics} = this.props

    if (!traderStatistics) {
      return (
        <Spinner />
      )
    }

    return (
      <div className="col-sm-12">
        <Container>
          <Row>
            <Col sm={12}>
              <Level level={traderStatistics.level}/>
            </Col>
          </Row>
          <Row>
            <Col sm={6}>
              <ExplodingPieChart title="All Investments" data={mapStatisticsToAllInvestments(traderStatistics)}/>
            </Col>
            <Col sm={6}>
              <ExplodingPieChart title="Active Investments" data={mapStatisticsToActiveInvestments(traderStatistics)}/>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <DashboardTabs props={this.props}/>
            </Col>
          </Row>
        </Container>
        
      </div>
    )
  }
}

function mapStatisticsToAllInvestments(traderStatistics) {

  let data = []
  for (let assetKey of Object.keys(traderStatistics.counts)) {
    let assetObj = traderStatistics.counts[assetKey]
    let asset = {"category": assetKey}
    let assetTotal = 0
    let collateralTotal = 0
    let directTotal = 0

    for (let typeKey of Object.keys(assetObj)) {
      let typeObj = assetObj[typeKey]
      let total = 0

      for (let stateKey of Object.keys(typeObj)) {
        let stateObj = typeObj[stateKey]
        let total = 0

        for (let sideKey of Object.keys(stateObj)) {
          let sideObj = stateObj[sideKey]
          assetTotal = assetTotal + sideObj.count

          if (typeKey === "0") {
            collateralTotal = collateralTotal + sideObj.count
          } else {
            directTotal = directTotal + sideObj.count
          }
        }
      }
    }

    asset.value = assetTotal
    asset.subData = [{ name: "Collateral", value: collateralTotal }, { name: "Direct", value: directTotal }]
    data.push(asset)
  }

  return data
}

function mapStatisticsToActiveInvestments(traderStatistics) {

  let data = []
  for (let assetKey of Object.keys(traderStatistics.counts)) {
    let assetObj = traderStatistics.counts[assetKey]
    let asset = {"category": assetKey}
    let assetTotal = 0
    let collateralTotal = 0
    let directTotal = 0

    for (let typeKey of Object.keys(assetObj)) {
      let typeObj = assetObj[typeKey]
      let total = 0

      for (let stateKey of Object.keys(typeObj)) {

        if (stateKey !== "active") {
          continue
        }

        let stateObj = typeObj[stateKey]
        let total = 0

        for (let sideKey of Object.keys(stateObj)) {
          let sideObj = stateObj[sideKey]
          assetTotal = assetTotal + sideObj.count

          if (typeKey === "0") {
            collateralTotal = collateralTotal + sideObj.count
          } else {
            directTotal = directTotal + sideObj.count
          }
        }
      }
    }

    asset.value = assetTotal
    asset.subData = [{ name: "Collateral", value: collateralTotal }, { name: "Direct", value: directTotal }]
    data.push(asset)
  }

  return data
}

function mapTrades(trades) {
  let data = trades.map(trade => {
    return {date: trade.start.toDate(), value: trade.formattedProfit}
  })
  return data
}

function DashboardTabs(props) {
  const [key, setKey] = React.useState('ratings')
  const {trader, trades, traderStatistics, page, section} = props.props

  const tradingRatingKeys = Object.keys(traderStatistics.tradingRatings.ratings)
  const profitRatingKeys = Object.keys(traderStatistics.profitRatings.ratings)

  return (
    <Tabs id="trader_dashboard"
        activeKey={section || key}
        onSelect={(k) => {setKey(k); props.props.history.push(`/${page}/${k}`)}}>
        
        <Tab eventKey="ratings" title="Ratings">
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="card shadow mb-4" key='ratings_trading'>
                <a href='#ratings_trading' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_trading'>
                  <h6>Trading Ratings</h6>
                </a>
                <div className="collapse" id="ratings_trading">
                  <div className="card-body">
                    <Container>
                      <Row>
                        <Col sm={4}>
                          <Alert variant="info">
                            Your trading rating is based on trade profits relative to other traders on this platform.
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
                                    <td><Rating ratingKey={`trading_${key}`} rating={traderStatistics.tradingRatings.ratings[key]}/></td>
                                    <td><h6>{traderStatistics.tradingRatings.formattedAverageProfits[key]}</h6></td>
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
                <div className="collapse" id="ratings_profit">
                  <div className="card-body">
                    <Container>
                      <Row>
                        <Col sm={4}>
                          <Alert variant="info">
                            Your profit rating is based on returns to your investors relative to the returns of other traders
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
                                    <td><Rating ratingKey={`profit_${key}`} rating={traderStatistics.profitRatings.ratings[key]}/></td>
                                    <td><h6>{traderStatistics.profitRatings.formattedAverageProfits[key]}</h6></td>
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
                <div className="collapse" id="ratings_trust">
                  <div className="card-body">
                    <Container>
                      <Row>
                        <Col sm={4}>
                          <Alert variant="info">
                            Your trust rating is based on how settlements are handled. Any suspect or fraudulent activity will impact it negatively, as well as waiting more than 48 hours to approve a settlement request
                          </Alert>
                        </Col>
                        <Col sm={8}>
                          <Row>
                            <Col sm={3}>
                              <h6>Trust</h6>
                            </Col>
                            <Col sm={9}>
                            {
                              traderStatistics.trustRating
                              ? <Rating ratingKey="trust" rating={traderStatistics.trustRating}/>
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
        </Tab>
        <Tab eventKey="tradeHistory" title="Trade History">
          <div className="card shadow mb-4">
            <div className="card-body">
              <Container>
                <Row>
                  <Col sm={12}>
                    <Alert variant="info">
                      Below are your completed trades on dydx.
                    </Alert>
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    { showTrades("ETH", trades["ETH"]) }
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    { showTrades("DAI", trades["DAI"]) }
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    { showTrades("USDC", trades["USDC"]) }
                  </Col>
                </Row>
              </Container>
            </div>
          </div>
        </Tab>
      </Tabs>
  );
}

function showTrades(title, trades) {
  if (trades === undefined || trades.length === 0) {
    return (
      <div></div>
    )
  }

  return (
    <DateLineChart title={title} data={mapTrades(trades)} />
  )
}


function mapStateToProps(state, ownProps) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    page: ownProps.page,
    section: ownProps.section,
    network: networkSelector(state),
    account: account,
    traderPaired: traderPaired,
    trader: traderSelector(state, account),
    traders: tradersSelector(state),
    trades: tradesSelector(state),
    traderStatistics: traderStatisticsSelector(state, account)
  }
}

export default connect(mapStateToProps)(withRouter(Trader))
