
import BigNumber from 'bignumber.js'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button, Badge } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Rating from '../Rating'
import Spinner from '../Spinner'

import PageLink from '../containers/PageLink'
import { Page } from '../containers/pages'

import AllocationChart from '../trader/AllocationChart'
import TinyNumber from '../cards/TinyNumber'
import TinyStars from '../cards/TinyStars'
import TinyRelativeRatings from '../cards/TinyRelativeRatings'

import { INVESTMENT_COLLATERAL, INVESTMENT_DIRECT, etherToWei, weiToEther, fail } from '../../helpers'
import { 
  web3Selector,
  networkSelector,
  accountSelector,
  traderPairedSelector,
  tokensSelector,
  balancesSelector,
  traderAllocationsSelector,
  traderStatisticsSelector,
  tradersSelector,
  walletSelector,
  investmentsSelector
} from '../../store/selectors'
import { 
  invest,
  loadTraderAllocations,
  loadBalances,
  loadTraderStatistics
} from '../../store/interactions'
import {
  notificationAdded
} from '../../store/actions'

class InvestorTraderDetail extends Component {

  componentDidMount() {
    const { web3, network, account, trader, traders, traderPaired, tokens, dispatch } = this.props

    loadTraderStatistics(trader.user, network, dispatch)
    loadTraderAllocations(network, trader.user, traderPaired, dispatch)
    loadBalances(account, traderPaired, tokens, web3, dispatch)
  }

  componentDidUpdate(prevProps) {
    const { web3, network, account, trader, traders, traderPaired, tokens, dispatch } = this.props

    if (trader.user !== prevProps.trader.user || network !== prevProps.network || account !== prevProps.account) {

      console.log("InvestorTraderDetail componentDidUpdate", prevProps)

      // loadTraderStatistics(trader.user, network, dispatch)
      // loadTraderAllocations(network, trader.user, traderPaired, dispatch)
      // loadBalances(account, traderPaired, tokens, web3, dispatch)
    }
  }

  render() {
    const {web3, trader, traderAllocations, traderStatistics, investments } = this.props

    if (!web3 || !trader || !traderStatistics) {
      return (
        <Spinner />
      )
    }

    const investmentCount = investments.filter(investment => investment.trader === trader.user).length

    const showCollateral = traderAllocations.some(allocation => allocation.symbol && !allocation.total.isZero())
    const showDirect = Object.keys(traderStatistics.limits.directLimits).some((key) => {
      let limit = traderStatistics.limits.directLimits[key]
      return limit.gt(0)
    })

    return (
      <div className="card shadow mb-4">
        <a href={`#trader_${trader.user}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`trader_${trader.user}`}>
          <h6 className="m-0 font-weight-bold text-primary">
            <Row>
              <Col sm={1}>
                {
                  investmentCount > 0 &&
                    <Badge variant="info">{investmentCount}</Badge>
                }
                <AddressImage address={trader.user}/>
              </Col>
              <Col sm={2}>
                <TinyNumber title="level" amount={traderStatistics.level} border="success" />
              </Col>
              <Col sm={3}>
                <TinyStars title="Trust" value={traderStatistics.trustRating} border="primary" />
              </Col>
              <Col sm={3}>
                <TinyRelativeRatings title="Trading Ratings" ratings={mapNameValueObject(traderStatistics.tradingRatings.ratings)} border="warning" />
              </Col>
              <Col sm={3}>
                <TinyRelativeRatings title="Profit Ratings" ratings={mapNameValueObject(traderStatistics.profitRatings.ratings)} border="danger" />
              </Col>
            </Row>
          </h6>
        </a>
        <div className="collapse" id={`trader_${trader.user}`}>
          <div className="card-body">
            <Container>
              <Row>
                <Col sm={3}>
                  <PageLink page={Page.TRADER_PROFILE} section={trader.user} target="_blank" styles="nav-link">
                      <i className="fas fa-fw fa-address-card"></i>
                      <span>Profile</span>
                  </PageLink>
                </Col>
                <Col sm={9}>
                  <div className="align-right"></div>
                </Col>
              </Row>
              {
                showCollateral
                ? <Row>
                    <Col sm={12}>
                      <Collateral props={this.props} />
                    </Col>
                  </Row>
                : <div/>
              }
              {
                showDirect
                ? <Row>
                    <Col sm={12}>
                      <Direct props={this.props} />
                    </Col>
                  </Row>
                : <div/>
              }
            </Container>
            
          </div>
        </div>
      </div>
      
    )
  }
}

function Collateral(props) {
  const {web3, trader, traderAllocations, traderStatistics, investments } = props.props

  return (
    <div className="card shadow mb-4" key={`collateral-${trader.user}`}>
      <a href={`#collateral${trader.user}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`collateral${trader.user}`}>
        <h6 className="m-0 font-weight-bold text-primary">
          <Row>
            <Col sm={1}>
              <i className="fas fa-university fa-2x text-gray-300"></i>
            </Col>
            <Col sm={5}>
              <div className="h6 mb-0 mr-3 font-weight-bold text-gray-800">Collateral Investment</div>
            </Col>
            <Col sm={6}>
              <div className="h6 mb-0 mr-3 text-gray-800">You will earn {`${trader.investorCollateralProfitPercent}`}% of the profit</div>
            </Col>
          </Row>
        </h6>
      </a>
      <div className="collapse" id={`collateral${trader.user}`}>
        <div className="card border-left-primary shadow h-100 py-0">
          <div className="card-body">
            <div className="row no-gutters align-items-left">
              <div className="col mr-2">
                {
                  traderAllocations.map((allocation) => {
                    if (allocation.symbol && !allocation.total.isZero()) {
                      return (
                        <div key={`collateral_${allocation.symbol}_${allocation.trader}`} className="row no-gutters align-items-left">
                          
                            <div className="col-sm-4">
                              <div className="h6 mb-0 mr-3 font-weight-bold text-gray-800"><Balance props={props.props} symbol={allocation.symbol}/></div>
                            </div>
                            <div className="col-sm-4">
                              <Form.Group controlId={`collateral_${allocation.symbol}${allocation.trader}_Amount`}>
                                <Form.Control type="number" placeholder={`Max: ${allocation.formattedAvailable}`} />
                              </Form.Group>
                            </div>
                            <div className="col-sm-4">
                              <Button variant="primary" onClick={(e) => {collateralInvestHandler(allocation, "collateral_"+allocation.symbol + allocation.trader + "_Amount", props.props)}}>
                                Invest {allocation.symbol}
                              </Button>
                            </div>
                        </div>
                      )
                    }
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Direct(props) {
  const {web3, trader, traderAllocations, traderStatistics, investments } = props.props

  return (
    <div className="card shadow mb-4" key={`direct-${trader.user}`}>
      <a href={`#direct${trader.user}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`direct${trader.user}`}>
        <h6 className="m-0 font-weight-bold text-primary">
          <Row>
            <Col sm={1}>
              <i className="fas fa-handshake fa-2x text-gray-300"></i>
            </Col>
            <Col sm={5}>
              <div className="h6 mb-0 mr-3 font-weight-bold text-gray-800">Direct Investment</div>
            </Col>
            <Col sm={6}>
              <div className="h6 mb-0 mr-3 text-gray-800">You will earn {`${trader.investorDirectProfitPercent}`}% of the profit</div>
            </Col>
          </Row>
        </h6>
      </a>
      <div className="collapse" id={`direct${trader.user}`}>
        <div className="card border-left-primary shadow h-100 py-0">
          <div className="card-body">
            <div className="row no-gutters align-items-left">
              <div className="col mr-2">
                {
                  traderAllocations.map((allocation) => {
                    const limit = traderStatistics.limits.directLimits[allocation.symbol]

                    if (limit && limit.gt(0)) {
                      return (
                        <div key={`direct_${allocation.symbol}_${allocation.trader}`} className="row no-gutters align-items-left">
                          
                            <div className="col-sm-4">
                              <div className="h6 mb-0 mr-3 font-weight-bold text-gray-800"><Balance props={props.props} symbol={allocation.symbol}/></div>
                            </div>
                            <div className="col-sm-4">
                              <Form.Group controlId={`direct_${allocation.symbol}${allocation.trader}_Amount`}>
                                <Form.Control type="number" placeholder={`Max: ${traderStatistics.limits.formattedDirectAvailable[allocation.symbol]}`} />
                              </Form.Group>
                            </div>
                            <div className="col-sm-4">
                              <Button variant="primary" onClick={(e) => {directInvestHandler(allocation, "direct_"+allocation.symbol + allocation.trader + "_Amount", props.props)}}>
                                Invest {allocation.symbol}
                              </Button>
                            </div>
                        </div>
                      )
                    }
                  })
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function mapNameValueObject(obj) {
  const keys = Object.keys(obj)
  let data = keys.map(key => {
    return {name: key, value: obj[key]}
  })
  return data
}

function Balance(props) {
  const {balances} = props.props
  const {symbol} = props

  let balance = 0
  let balanceObj = getBalance(balances, symbol)

  if (balanceObj !== undefined) {
    balance = balanceObj.formatted
  }

  return (
    <span>{symbol} Wallet Balance: {balance}</span>
  )
}

function getBalance(balances, symbol) {
  return balances.find(b => b.symbol === symbol)
}

function collateralInvestHandler (allocation, inputId, props) {
  const {network, account, trader, balances, tokens, wallet, web3, dispatch} = props

  console.log("collateralInvestHandler tokens", tokens)

  console.log("collateralInvestHandler allocation", allocation)

  let balance = new BigNumber(0)
  let balanceObj = getBalance(balances, allocation.symbol)

  if (balanceObj !== undefined) {
    balance = balanceObj.amount
  }

  const token = tokens.find(t => t.contract.options.address === allocation.token)

  console.log("collateralInvestHandler token", token)

  const decimals = token ? token.decimals : 18
  const amount = document.getElementById(inputId).value
  const weiAmount = etherToWei(amount, decimals)

  if (weiAmount.lte(balance)) {
    if (weiAmount.lte(allocation.available)) {
      console.log("collateralInvestHandler", wallet.contract)
      invest(network, account, trader.user, allocation.token, token, weiAmount, wallet.contract, INVESTMENT_COLLATERAL, web3, dispatch)
    } else {
      dispatch(notificationAdded(fail("Invest", `Investment exceeds available amount of ${allocation.formattedAvailable}`)))
    }
  } else {
    dispatch(notificationAdded(fail("Invest", "Wallet balance too small")))
  }
}

function directInvestHandler (allocation, inputId, props) {
  const {network, account, trader, traderStatistics, balances, tokens, wallet, web3, dispatch} = props

  console.log("directInvestHandler tokens", tokens)

  console.log("directInvestHandler allocation", allocation)

  let balance = new BigNumber(0)
  let balanceObj = getBalance(balances, allocation.symbol)

  if (balanceObj !== undefined) {
    balance = balanceObj.amount
  }

  const token = tokens.find(t => t.contract.options.address === allocation.token)

  console.log("directInvestHandler token", token)

  const decimals = token ? token.decimals : 18
  const amount = document.getElementById(inputId).value
  const weiAmount = etherToWei(amount, decimals)
  const directAvailable = traderStatistics.limits.directLimits[allocation.symbol].minus(traderStatistics.limits.directInvested[allocation.symbol])

  if (weiAmount.lte(balance)) {
    if (weiAmount.lte(directAvailable)) {
      invest(network, account, trader.user, allocation.token, token, weiAmount, wallet.contract, INVESTMENT_DIRECT, web3, dispatch)
    } else {
      dispatch(notificationAdded(fail("Invest", `Investment exceeds available amount of ${traderStatistics.limits.formattedDirectAvailable[allocation.symbol]}`)))
    }
  } else {
    dispatch(notificationAdded(fail("Invest", "Wallet balance too small")))
  }
}

function mapStateToProps(state, props) {
  const account = accountSelector(state)

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
    account: account,
    trader: props.trader,
    traderPaired: traderPairedSelector(state),
    traderAllocations: traderAllocationsSelector(state, props.trader.user),
    traders: tradersSelector(state),
    traderStatistics: traderStatisticsSelector(state, props.trader.user),
    tokens: tokensSelector(state),
    balances: balancesSelector(state),
    wallet: walletSelector(state),
    investments: investmentsSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorTraderDetail)


