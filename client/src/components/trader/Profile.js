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
import AddressLink from '../AddressLink'
import PageLink from '../containers/PageLink'
import { Page } from '../containers/pages'

import { 
  networkSelector,
  accountSelector, 
  traderSelector,
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

class Profile extends Component {
  componentDidMount() {
    const { network, dispatch, section } = this.props

    if (network) {
      loadTrades(network, section, dispatch)
      loadTraderStatistics(section, network, dispatch)
    }
  }

  componentDidUpdate(prevProps) {
    const { network, dispatch, section } = this.props

    if (network !== prevProps.network) {
      loadTrades(network, section, dispatch)
      loadTraderStatistics(section, network, dispatch)
    }
  }

  render() {
    const {trader, trades, traderStatistics, page, section} = this.props

    if (!traderStatistics) {
      return (
        <Spinner />
      )
    }

    const tradingRatingKeys = Object.keys(traderStatistics.tradingRatings.ratings)
    const profitRatingKeys = Object.keys(traderStatistics.profitRatings.ratings)

    return (
      <div className="col-sm-12">
        <Container>
          <Row>
            <Col sm={1}>
              <PageLink page={Page.INVESTOR_TRADERS} section={section} target="_blank" styles="nav-link">
                  <i className="fas fa-fw fa-external-link-alt"></i>
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">Invest</div>
              </PageLink>
            </Col>
            <Col sm={11}>
              <Level level={traderStatistics.level} />
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
            {
              traderStatistics.trustRating
              ? <SmallStars title="Trust" value={traderStatistics.trustRating} icon="fa-thumbs-up" border="primary"/>
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

function mapNameValueObject(obj) {
  const keys = Object.keys(obj)
  let data = keys.map(key => {
    return {name: key, value: obj[key]}
  })
  return data
}

function mapTrades(trades) {
  let data = trades.map(trade => {
    return {date: trade.start.toDate(), value: trade.formattedProfit}
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

  return {
    page: ownProps.page,
    section: ownProps.section,
    network: networkSelector(state),
    account: account,
    trades: tradesSelector(state),
    trader: traderSelector(state, ownProps.section),
    traderStatistics: traderStatisticsSelector(state, ownProps.section)
  }
}

export default connect(mapStateToProps)(withRouter(Profile))
