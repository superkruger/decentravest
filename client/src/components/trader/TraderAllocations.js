import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import AllocationChart from './AllocationChart'
import { ZERO_ADDRESS, tokenDecimalsForAddress } from '../../helpers'
import { 
  web3Selector,
  accountSelector,
  traderPairedSelector,
  traderAllocationsSelector,
  tokensSelector,
  balancesSelector
} from '../../store/selectors'
import { 
  loadTraderAllocations,
  setTraderAllocation,
  loadBalances
} from '../../store/interactions'

class TraderAllocations extends Component {

  componentDidMount() {
    const { account, traderPaired, tokens, web3, dispatch } = this.props
    loadTraderAllocations(account, traderPaired, dispatch)
    loadBalances(account, traderPaired, tokens, web3, dispatch)
  }

  render() {
    const {account, traderAllocations} = this.props

    const allocationList = [
      {
        symbol: 'ETH',
        token: ZERO_ADDRESS
      },
      {
        symbol: 'DAI',
        token: `${process.env.REACT_APP_DAI_ADDRESS}`
      },
      {
        symbol: 'USDC',
        token: `${process.env.REACT_APP_USDC_ADDRESS}`
      }
    ]

    return (
      <Container>
          <Row>
            <Col sm={12}>
              { 
                allocationList.map((allocation) => {
                  const traderAllocation = getTraderAllocation(allocation.token, traderAllocations)

                  return (
                    <div className="card shadow mb-4" key={`${allocation.symbol}_${account}`}>
                      <a href={`#${allocation.symbol}${account}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`${allocation.symbol}${account}`}>
                        <h6 className="m-0 font-weight-bold text-primary">{allocation.symbol} Allocation</h6>
                      </a>
                      <div className="collapse" id={`${allocation.symbol}${account}`}>
                        <div className="card-body">
                          <Container>
                            <Row>
                              <Col sm={6}>
                                  <div>
                                    {
                                      traderAllocation && !traderAllocation.total.isZero()
                                      ? <AllocationChart data={traderAllocation}/>
                                      : <span>No allocation made</span>
                                    }
                                  </div>
                              </Col>
                              <Col sm={6}>
                                  <div>
                                    <Balance props={this.props} symbol={allocation.symbol}/>
                                    <Form>
                                      <Form.Group controlId={`${allocation.symbol}${account}_Amount`}>
                                        <Form.Control type="number" placeholder={`Enter ${allocation.symbol} Amount`} />
                                      </Form.Group>
                                      <Button variant="primary" onClick={(e) => {allocationSubmitHandler(allocation.token, allocation.symbol + account + "_Amount", this.props)}}>
                                        Set {allocation.symbol} Allocation
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

function getTraderAllocation(token, traderAllocations) {
  return traderAllocations.find(allocation => allocation.token === token)
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

function allocationSubmitHandler (tokenAddress, inputId, props) {
  const {account, traderPaired, dispatch} = props

  const amount = document.getElementById(inputId).value
  setTraderAllocation(account, tokenAddress, amount, tokenDecimalsForAddress(tokenAddress), traderPaired, dispatch)
}

function mapStateToProps(state) {
  const account = accountSelector(state)
  return {
    web3: web3Selector(state),
    account: account,
    traderPaired: traderPairedSelector(state),
    traderAllocations: traderAllocationsSelector(state, account),
    tokens: tokensSelector(state),
    balances: balancesSelector(state)
  }
}

export default connect(mapStateToProps)(TraderAllocations)


