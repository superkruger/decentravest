import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import AddressImage from '../AddressImage'
import Spinner from '../Spinner'
import Rating from '../Rating'
import AllocationChart from '../trader/AllocationChart'
import { ZERO_ADDRESS, formatBalance, etherToWei } from '../../helpers'
import { 
  web3Selector,
  accountSelector,
  traderPairedSelector,
  tokensSelector,
  balancesSelector,
  traderAllocationsSelector,
  traderRatingsSelector,
  tradersSelector,
  walletSelector
} from '../../store/selectors'
import { 
  invest,
  loadTraderAllocations,
  loadBalances
} from '../../store/interactions'
import {
  loadTraderRatings
} from '../../store/dydxInteractions'

class InvestorTraderDetail extends Component {

  componentDidMount() {
    const { web3, account, trader, traders, traderPaired, tokens, dispatch } = this.props
    loadTraderRatings(trader.user, traders, dispatch)
    loadTraderAllocations(trader.user, traderPaired, dispatch)
    loadBalances(account, traderPaired, tokens, web3, dispatch)
  }

  render() {
    const {trader, traderAllocations, traderRatings } = this.props

    if (!traderAllocations || traderAllocations.length === 0) {
      return (
        <Spinner />
      )
    }

    console.log("traderAllocations...", traderAllocations)

    return (
      <Container>
          <Row>
            <Col sm={12}>
              { 
                traderAllocations.map((allocation) => {

                  if (!allocation.symbol) {
                    return (<div/>)
                  }

                  let ratingsSymbol = allocation.symbol === 'ETH' ? 'WETH' : allocation.symbol

                  return (
                    <div className="card shadow mb-4" key={allocation.symbol}>
                      <a href={`#${allocation.symbol}_Allocation`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`${allocation.symbol}_Allocation`}>
                        <h6 className="m-0 font-weight-bold text-primary">{allocation.symbol} <Rating asset={allocation.symbol} rating={`${traderRatings[ratingsSymbol]}`}/></h6>
                      </a>
                      <div className="collapse" id={`${allocation.symbol}_Allocation`}>
                        <div className="card-body">
                          <Container>
                            <Row>
                              <Col sm={6}>
                                <div>
                                  {
                                    <AllocationChart data={allocation}/>
                                  }
                                </div>
                              </Col>
                              <Col sm={6}>
                                  <div>
                                    <Balance props={this.props} symbol={allocation.symbol}/>
                                    <Form>
                                      <Form.Group controlId={`${allocation.symbol}AllocationAmount`}>
                                        <Form.Control type="number" placeholder={`Enter ${allocation.symbol} Amount`} />
                                      </Form.Group>
                                      <Button variant="primary" onClick={(e) => {investHandler(allocation.token, allocation.symbol + "AllocationAmount", this.props)}}>
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
                })
              }
            </Col>
          </Row>
        </Container>
    )
  }
}

function Balance(props) {
  const {web3, account, tokens, balances} = props.props
  const {symbol} = props

  let balance = 0
  let balanceObj = balances.find(b => b.symbol === symbol)

  if (balanceObj !== undefined) {
    balance = balanceObj.formatted
  }

  return (
    <span>Wallet Balance: {balance}</span>
  )
}

function investHandler (tokenAddress, inputId, props) {
  const {account, trader, tokens, wallet, dispatch} = props

  console.log("ts", tokens, tokenAddress)

  const token = tokens.find(t => t.contract.options.address === tokenAddress)

  console.log("t", token)

  const amount = document.getElementById(inputId).value
  invest(account, trader.user, tokenAddress, token, amount, wallet, dispatch)
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
    wallet: walletSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorTraderDetail)


