import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Rating from '../Rating'
import AllocationChart from '../trader/AllocationChart'
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

    if (!traderAllocations || traderAllocations.length === 0 || !traderAllocations.some(allocation => !allocation.total.isZero())) {
      return (
        <div />
      )
    }

    return (
      <div className="card shadow mb-4">
        <a href={`#trader_${trader.user}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`trader_${trader.user}`}>
          <h6 className="m-0 font-weight-bold text-primary"><AddressImage address={trader.user}/></h6>
        </a>
        <div className="collapse" id={`trader_${trader.user}`}>
          <div className="card-body">
            <Container>
              <Row>
                <Col sm={12}>
                  { 
                    traderAllocations.map((allocation) => {

                      if (!allocation.symbol || allocation.total.isZero()) {
                        return (<div/>)
                      }

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
                                          <Form.Group controlId={`${allocation.symbol}${allocation.trader}_Amount`}>
                                            <Form.Control type="number" placeholder={`Enter ${allocation.symbol} Amount`} />
                                          </Form.Group>
                                          <Button variant="primary" onClick={(e) => {investHandler(allocation.token, allocation.symbol + allocation.trader + "_Amount", this.props)}}>
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

  const token = tokens.find(t => t.contract.options.address === tokenAddress)

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

