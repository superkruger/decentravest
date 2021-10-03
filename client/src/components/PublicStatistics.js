
import BigNumber from 'bignumber.js'
import { get, sumBy } from 'lodash'
import React, { Component } from 'react'
import {isEqual} from 'lodash'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Spinner from './Spinner'
import SmallNumber from './cards/SmallNumber'
import SmallCurrencyAmounts from './cards/SmallCurrencyAmounts'
import AddressLink from './AddressLink'
import AddressImage from './AddressImage'
import PageLink from './containers/PageLink'
import TinyNumber from './cards/TinyNumber'
import TinyStars from './cards/TinyStars'
import TinyRelativeRatings from './cards/TinyRelativeRatings'

import { 
  networkSelector,
  publicStatisticsSelector,
  tradersSelector
} from '../store/selectors'
import { 
  loadPublicStatistics,
  loadTraderStatistics
} from '../store/interactions'
import { 
  ZERO_ADDRESS, 
  displaySymbol, 
  formatBalance, 
  mapNameValueObject } from '../helpers'

class PublicStatistics extends Component {
  // constructor(props) {
  //   super(props);

  //   const { section } = props

  //   this.state = {filterTradingAsset: 'ETH', filterProfitAsset: 'ETH'};
  // }

  componentDidMount() {
    const { network, dispatch } = this.props

    if (network) {
      loadPublicStatistics(network, dispatch)
    }
  }

  componentDidUpdate(prevProps) {
    const { network, dispatch } = this.props

    if (!isEqual(network, prevProps.network)) {
      loadPublicStatistics(network, dispatch)
    }
  }

  render() {
    const {publicStatistics, traders, network, dispatch} = this.props

    let publicStats = publicStatistics

    if (!publicStats || !traders) {
      return (
        <Spinner />
      )
    }

    console.log("publicStats", publicStats)

    const traderCount = get(publicStats, 'traderCount', 0)
    const investorCount = get(publicStats, 'investorCount', 0)

    const investmentCount = sumBy(publicStats.investments, 'count')
    const investmentProfits = mapInvestmentProfits(publicStats.investments)

    if (publicStats.traders) {
      for(let i=0; i<publicStats.traders.length; i++) {
        let trader = traders.find(trader => trader.user === publicStats.traders[i].user)

        if (!trader || (trader && !trader.statistics)) {
          loadTraderStatistics(publicStats.traders[i].user, network, dispatch)
          return (
            <Spinner />
          )
        } else {
          publicStats.traders[i].statistics = trader.statistics
        }
      }

      // publicStatistics.traders.sort((a,b) => {

      //   switch(this.state.filter) {
      //     case 'filterRadiosTrust': {
      //       return b.statistics.trustRating - a.statistics.trustRating
      //       break
      //     }
      //     case 'filterRadiosTrading': {
      //       return b.statistics.tradingRatings.ratings[this.state.filterTradingAsset] - 
      //         a.statistics.tradingRatings.ratings[this.state.filterTradingAsset]
      //       break
      //     }
      //     case 'filterRadiosProfit': {
      //       return b.statistics.profitRatings.ratings[this.state.filterProfitAsset] - 
      //         a.statistics.profitRatings.ratings[this.state.filterProfitAsset]
      //       break
      //     }
      //   }
      // })
    }

    return (
      <div className="col-sm-12">
        <Container>
          <Row>
            <Col sm={6}>
              <Alert variant="info">
                Sign up as a trader before the end of 2020, and get 100% off on fees for the entire 2021 !!<br/>
                Sign up between January and March of 2021 and get 50% off.
              </Alert>
            </Col>
            <Col sm={6}>
            </Col>
          </Row>
          <Row>
            <Col sm={6}>
              <SmallNumber title="Active Traders" amount={traderCount} icon="fa-chart-line" border="primary" />
            </Col>
            <Col sm={6}>
              <SmallNumber title="Investors" amount={investorCount} icon="fa-coins" border="primary" />
            </Col>
          </Row>
          <br/>
          <Row>
            <Col sm={6}>
              <SmallNumber title="Investments" amount={investmentCount} icon="fa-piggy-bank" border="primary" />
            </Col>
            <Col sm={6}>
              <SmallCurrencyAmounts title="Total Profits" icon="fa-hand-holding-usd" border="primary" amounts={investmentProfits}/>
            </Col>
          </Row>
          <br/>
          <Row>
            <Col sm={12}>
              <h3>Active Traders</h3>
            </Col>
          </Row>
          { 
            <TraderList traders={publicStats.traders} props={this.props} />
          }
          
        </Container>
        
      </div>
    )
  }
}

function TraderList(props) {

  const {traders} = props

  if (traders.length === 0) {
    return (
      <h5>
        No active traders at the moment.<br/>
        If you're a crypto trader, now's your chance to get investments!!!
      </h5>
    )
  } else {
    return (
      <div>
      {
        traders.map((trader) => {
          return (
            <TraderDetail trader={trader} key={trader.user} props={props.props}/>
          )
        })
      }
      </div>
    )
  }
}

function TraderDetail(props) {
  const {trader} = props
  const {network} = props.props

  return (
    <div>
    <Row>
      <Col sm={1}>
        <AddressLink address={trader.user} network={network}/>
      </Col>
      <Col sm={2}>
        <TinyNumber title="level" amount={trader.statistics.level} border="success" />
      </Col>
      <Col sm={3}>
        <TinyStars title="Trust" value={trader.statistics.trustRating} border="primary" />
      </Col>
      <Col sm={3}>
        <TinyRelativeRatings title="Trading Ratings" ratings={mapNameValueObject(trader.statistics.tradingRatings.ratings)} border="warning" />
      </Col>
      <Col sm={3}>
        <TinyRelativeRatings title="Profit Ratings" ratings={mapNameValueObject(trader.statistics.profitRatings.ratings)} border="danger" />
      </Col>
    </Row>
    <hr/>
    </div>
  )
}

function mapInvestmentProfits(investments) {
  if (!investments) {
    return []
  }
  return investments.map(investment => {
    return {
      "name": investment.asset,
      "value": formatBalance(new BigNumber(investment.profit), investment.asset)
    }
  })
}

function mapStateToProps(state, ownProps) {

  return {
    network: networkSelector(state),
    publicStatistics: publicStatisticsSelector(state),
    traders: tradersSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(PublicStatistics))
