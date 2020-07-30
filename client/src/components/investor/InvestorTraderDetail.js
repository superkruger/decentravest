
import BigNumber from 'bignumber.js'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Rating from '../Rating'
import AllocationChart from '../trader/AllocationChart'
import { etherToWei, weiToEther, fail } from '../../helpers'
import { 
  web3Selector,
  accountSelector,
  traderPairedSelector,
  tokensSelector,
  balancesSelector,
  traderAllocationsSelector,
  traderRatingsSelector,
  tradersSelector,
  walletSelector,
  investmentsSelector
} from '../../store/selectors'
import { 
  invest,
  loadTraderAllocations,
  loadBalances
} from '../../store/interactions'
import {
  loadTraderRatings
} from '../../store/dydxInteractions'
import {
  notificationAdded
} from '../../store/actions'

class InvestorTraderDetail extends Component {

  componentDidMount() {
    const { web3, account, trader, traders, traderPaired, tokens, dispatch } = this.props
    loadTraderRatings(trader.user, traders, dispatch)
    loadTraderAllocations(trader.user, traderPaired, dispatch)
    loadBalances(account, traderPaired, tokens, web3, dispatch)
  }

  render() {
    const {trader, traderAllocations, traderRatings, investments } = this.props

    if (!traderAllocations || traderAllocations.length === 0 || !traderAllocations.some(allocation => !allocation.total.isZero())) {
      return (
        <div />
      )
    }

    return (
      <div className="card shadow mb-4">
        <a href={`#trader_${trader.user}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`trader_${trader.user}`}>
          <h6 className="m-0 font-weight-bold text-primary">
            <Row>
              <Col sm={1}>
                <AddressImage address={trader.user}/>
              </Col>
              <Col sm={5}>
                {trader.user}
              </Col>
              <Col sm={2}>
              </Col>
              <Col sm={4} className="text-right">
                {investments.filter(investment => investment.trader === trader.user).length} investments
              </Col>
            </Row>
          </h6>
        </a>
        <div className="collapse" id={`trader_${trader.user}`}>
          <div className="card-body">
            <Container>
              <Row>
                <Col sm={12}>
                  { 
                    traderAllocations.map((allocation) => {

                      if (allocation.symbol && !allocation.total.isZero()) {

                        let ratingsSymbol = allocation.symbol === 'ETH' ? 'WETH' : allocation.symbol

                        return (
                          <div className="card shadow mb-4" key={`${allocation.symbol}_${allocation.trader}`}>
                            <a href={`#${allocation.symbol}${allocation.trader}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`${allocation.symbol}${allocation.trader}`}>
                              <h6 className="m-0 font-weight-bold text-primary">{allocation.symbol} <Rating asset={allocation.symbol} rating={`${traderRatings[ratingsSymbol]}`}/></h6>
                            </a>
                            <div className="collapse" id={`${allocation.symbol}${allocation.trader}`}>
                              <div className="card-body">
                                <Container>
                                  <Row>
                                    <Col sm={6}>
                                      <span>Available: {allocation.formattedAvailable}</span>
                                      <div>
                                        {
                                          <AllocationChart trader={trader.user} token={allocation.token}/>
                                        }
                                      </div>
                                    </Col>
                                    <Col sm={6}>
                                        <div>
                                          <Balance props={this.props} symbol={allocation.symbol}/>
                                          <Form>
                                            <Form.Group controlId={`${allocation.symbol}${allocation.trader}_Amount`}>
                                              <Form.Control type="number" placeholder={`Enter ${allocation.symbol} Amount`} />
                                            </Form.Group>
                                            <Button variant="primary" onClick={(e) => {investHandler(allocation, allocation.symbol + allocation.trader + "_Amount", this.props)}}>
                                              Invest {allocation.symbol}
                                            </Button>
                                          </Form>
                                        </div>
                                    </Col>
                                  </Row>
                                </Container>
                              </div>
                            </div>
                          </div>
                        )
                      }
                    })
                  }
                </Col>
              </Row>
            </Container>
          </div>
        </div>
      </div>
      
    )
  }
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
    <span>Wallet Balance: {balance}</span>
  )
}

function getBalance(balances, symbol) {
  return balances.find(b => b.symbol === symbol)
}

function investHandler (allocation, inputId, props) {
  const {account, trader, balances, tokens, wallet, dispatch} = props

  console.log("investHandler tokens", tokens)

  console.log("investHandler allocation", allocation)

  let balance = new BigNumber(0)
  let balanceObj = getBalance(balances, allocation.symbol)

  if (balanceObj !== undefined) {
    balance = balanceObj.amount
  }

  const token = tokens.find(t => t.contract.options.address === allocation.token)

  console.log("investHandler token", token)

  const decimals = token ? token.decimals : 18
  const amount = document.getElementById(inputId).value
  const weiAmount = etherToWei(amount, decimals)

  if (weiAmount.lte(balance)) {
    if (weiAmount.lte(allocation.available)) {
      invest(account, trader.user, allocation.token, token, weiAmount, wallet.contract, dispatch)
    } else {
      dispatch(notificationAdded(fail("Invest", `Allocation exceeds available amount of ${allocation.formattedAvailable}`)))
    }
  } else {
    dispatch(notificationAdded(fail("Invest", "Wallet balance too small")))
  }
}

function mapStateToProps(state, props) {
  const account = accountSelector(state)

  return {
    web3: web3Selector(state),
    account: account,
    trader: props.trader,
    traderPaired: traderPairedSelector(state),
    traderAllocations: traderAllocationsSelector(state, props.trader.user),
    traders: tradersSelector(state),
    traderRatings: traderRatingsSelector(state, props.trader.user),
    tokens: tokensSelector(state),
    balances: balancesSelector(state),
    wallet: walletSelector(state),
    investments: investmentsSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorTraderDetail)


