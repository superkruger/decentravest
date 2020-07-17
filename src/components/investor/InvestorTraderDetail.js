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

    return (
      <Container>
          <Row>
            <Col sm={12}>
              <div className="card bg-light text-dark">
                
                <div className="card-header">
                  <h3>ETH <Rating asset="WETH" rating={`${traderRatings["WETH"]}`}/></h3>
                </div>
                <div className="card-body">
                  <Row>
                    <Col sm={6}>
                        <div>
                          {
                            traderAllocations["ETH"] !== undefined ?
                            <AllocationChart data={traderAllocations["ETH"]}/> :
                            <Spinner />
                          }
                        </div>
                    </Col>
                    <Col sm={6}>
                        <div>
                          <Balance props={this.props} symbol="ETH"/>
                          <Form>
                            <Form.Group controlId="ethAllocationAmount">
                              <Form.Control type="number" placeholder="Enter ETH Amount" />
                            </Form.Group>
                            <Button variant="primary" onClick={(e) => {investHandler(ZERO_ADDRESS, "ethAllocationAmount", this.props)}}>
                              Invest ETH
                            </Button>
                          </Form>
                        </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <div className="card bg-light text-dark">
                
                <div className="card-header">
                  <h3>DAI <Rating asset="DAI" rating={`${traderRatings["DAI"]}`}/></h3>
                </div>
                <div className="card-body">
                  <Row>
                    <Col sm={6}>
                        <div>
                            {
                              traderAllocations["DAI"] !== undefined ?
                              <AllocationChart data={traderAllocations["DAI"]}/> :
                              <Spinner />
                            }
                        </div>
                    </Col>
                    <Col sm={6}>
                        <div>
                          <Balance props={this.props} symbol="DAI"/>
                          <Form>
                            <Form.Group controlId="daiAllocationAmount">
                              <Form.Control type="number" placeholder="Enter DAI Amount" />
                            </Form.Group>
                            <Button variant="primary" onClick={(e) => {investHandler(`${process.env.REACT_APP_DAI_ADDRESS}`, "daiAllocationAmount", this.props)}}>
                              Invest DAI
                            </Button>
                          </Form>
                        </div>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <div className="card bg-light text-dark">
                
                <div className="card-header">
                  <h3>USDC <Rating asset="USDC" rating={`${traderRatings["USDC"]}`}/></h3>
                </div>
                <div className="card-body">
                  <Row>
                    <Col sm={6}>
                        <div>
                            {
                              traderAllocations["USDC"] !== undefined ?
                              <AllocationChart data={traderAllocations["USDC"]}/> :
                              <Spinner />
                            }
                        </div>
                    </Col>
                    <Col sm={6}>
                        <div>
                          <Balance props={this.props} symbol="USDC"/>
                          <Form>
                            <Form.Group controlId="usdcAllocationAmount">
                              <Form.Control type="number" placeholder="Enter USDC Amount" />
                            </Form.Group>
                            <Button variant="primary" onClick={(e) => {investHandler(`${process.env.REACT_APP_USDC_ADDRESS}`, "usdcAllocationAmount", this.props)}}>
                              Invest USDC
                            </Button>
                          </Form>
                        </div>
                    </Col>
                  </Row>
                </div>
              </div>
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


