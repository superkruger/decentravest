import moment from 'moment'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Spinner from '../Spinner'
import Rating from '../Rating'
import Level from '../cards/Level'
import SmallStars from '../cards/SmallStars'
import ExplodingPieChart from '../cards/ExplodingPieChart'
import DateLineChart from '../cards/DateLineChart'
import SmallRelativeRatings from '../cards/SmallRelativeRatings'
import SmallCurrencyAmounts from '../cards/SmallCurrencyAmounts'

import { 
  networkSelector,
  accountSelector, 
  traderSelector,
  traderPairedSelector,
  tradersSelector,
  tradesSelector,
  traderStatisticsSelector,
  traderAllocationsSelector
} from '../../store/selectors'
import { 
  loadTraderAllocations,
  loadTraderStatistics,
  loadTrades
} from '../../store/interactions'
import { ZERO_ADDRESS, displaySymbol } from '../../helpers'

class Trader extends Component {
  componentDidMount() {
    const { network, account, traderPaired, dispatch } = this.props
    if (network && account && traderPaired) {
      loadTraderAllocations(network, account, traderPaired, dispatch)
      loadTrades(network, account, dispatch)
      loadTraderStatistics(account, network, dispatch)
    }
  }


  componentDidUpdate(prevProps) {
    const { account, network, traderPaired, dispatch } = this.props

    if (account !== prevProps.account || network !== prevProps.network && traderPaired !== prevProps.traderPaired) {
      loadTraderAllocations(network, account, traderPaired, dispatch)
      loadTrades(network, account, dispatch)
      loadTraderStatistics(account, network, dispatch)
    }
  }

  render() {
    const {traderStatistics, traderAllocations, trades} = this.props

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
              <Level level={traderStatistics.level} showInfo={true} />
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
            {
              traderStatistics.trustRating
              ? <SmallStars title="Trust" value={traderStatistics.trustRating} icon="fa-thumbs-up" border="primary" />
              : <span>Not enough data yet. Needs at least one settlement</span>
            }
            </Col>
            <Col sm={4}>
              <SmallRelativeRatings title="Trading Ratings" ratings={mapNameValueObject(traderStatistics.tradingRatings.ratings)} icon="fa-chart-line" border="warning" />
            </Col>
            <Col sm={4}>
              <SmallRelativeRatings title="Profit Ratings" ratings={mapNameValueObject(traderStatistics.profitRatings.ratings)} icon="fa-hand-holding-usd" border="danger" />
            </Col>
          </Row>
          <br/>
          <Row>
            <Col sm={4}>
              <SmallCurrencyAmounts title="Collateral Allocations" amounts={mapAllocations(traderAllocations, "formattedTotal")} icon="fa-university" border="secondary" />
            </Col>
            <Col sm={4}>
              <SmallCurrencyAmounts title="Collateral Investments" amounts={mapAllocations(traderAllocations, "formattedInvested")} icon="fa-university" border="secondary" />
            </Col>
            <Col sm={4}>
              <SmallCurrencyAmounts title="Collateral Available" amounts={mapAllocations(traderAllocations, "formattedAvailable")} icon="fa-university" border="secondary" />
            </Col>
          </Row>
          <br/>
          <Row>
            <Col sm={4}>
              <SmallCurrencyAmounts title="Direct Allocations" amounts={mapNameValueObject(traderStatistics.limits.formattedDirectLimits)} icon="fa-handshake" border="dark" />
            </Col>
            <Col sm={4}>
              <SmallCurrencyAmounts title="Direct Investments" amounts={mapNameValueObject(traderStatistics.limits.formattedDirectInvested)} icon="fa-handshake" border="dark" />
            </Col>
            <Col sm={4}>
              <SmallCurrencyAmounts title="Direct Available" amounts={mapNameValueObject(traderStatistics.limits.formattedDirectAvailable)} icon="fa-handshake" border="dark" />
            </Col>
          </Row>
          <br/>
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
              { showTrades("ETH Trades", trades["ETH"]) }
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              { showTrades("DAI Trades", trades["DAI"]) }
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              { showTrades("USDC Trades", trades["USDC"]) }
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
    if (assetTotal > 0) {
      asset.value = assetTotal
      asset.subData = [{ name: "Collateral", value: collateralTotal }, { name: "Direct", value: directTotal }]
      data.push(asset)
    }
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

    if (assetTotal > 0) {
      asset.value = assetTotal
      asset.subData = [{ name: "Collateral", value: collateralTotal }, { name: "Direct", value: directTotal }]
      data.push(asset)
    }
  }

  return data
}

function mapTrades(trades) {
  let data = trades.map(trade => {
    return {date: trade.start.toDate(), value: trade.formattedProfit}
  })
  return data
}

function mapAllocations(allocations, valueKey) {
  let data = allocations.map(allocation => {
    return {name: allocation.symbol, value: allocation[valueKey]}
  })
  return data
}

function mapNameValueObject(obj) {
  const keys = Object.keys(obj)
  let data = keys.map(key => {
    return {name: key, value: obj[key]}
  })
  return data
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
    traderStatistics: traderStatisticsSelector(state, account),
    traderAllocations: traderAllocationsSelector(state, account)
  }
}

export default connect(mapStateToProps)(withRouter(Trader))
