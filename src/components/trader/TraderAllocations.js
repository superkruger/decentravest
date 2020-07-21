import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import Spinner from '../Spinner'
import AllocationChart from './AllocationChart'
import { ZERO_ADDRESS, formatBalance } from '../../helpers'
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
    const {traderAllocations} = this.props

    if (traderAllocations === undefined || traderAllocations.length === 0) {
      return (
        <Spinner />
      )
    }

    return (
      <Container>
          <Row>
            <Col sm={12}>

              <div className="card shadow mb-4">
                <a href="#ETH_Allocation" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="ETH_Allocation">
                  <h6 className="m-0 font-weight-bold text-primary">ETH Allocation</h6>
                </a>
                <div className="collapse" id="ETH_Allocation">
                  <div className="card-body">
                    <Container>
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
                                <Button variant="primary" onClick={(e) => {allocationSubmitHandler(ZERO_ADDRESS, "ethAllocationAmount", 18, this.props)}}>
                                  Set ETH Allocation
                                </Button>
                              </Form>
                            </div>
                        </Col>
                      </Row>
                    </Container>
                  </div>
                </div>
              </div>

              <div className="card shadow mb-4">
                <a href="#DAI_Allocation" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="DAI_Allocation">
                  <h6 className="m-0 font-weight-bold text-primary">DAI Allocation</h6>
                </a>
                <div className="collapse" id="DAI_Allocation">
                  <div className="card-body">
                    <Container>
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
                                <Button variant="primary" onClick={(e) => {allocationSubmitHandler(`${process.env.REACT_APP_DAI_ADDRESS}`, "daiAllocationAmount", 18, this.props)}}>
                                  Set DAI Allocation
                                </Button>
                              </Form>
                            </div>
                        </Col>
                      </Row>
                    </Container>
                  </div>
                </div>
              </div>

              <div className="card shadow mb-4">
                <a href="#USDC_Allocation" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="USDC_Allocation">
                  <h6 className="m-0 font-weight-bold text-primary">USDC Allocation</h6>
                </a>
                <div className="collapse" id="USDC_Allocation">
                  <div className="card-body">
                    <Container>
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
                                <Button variant="primary" onClick={(e) => {allocationSubmitHandler(`${process.env.REACT_APP_USDC_ADDRESS}`, "usdcAllocationAmount", 6, this.props)}}>
                                  Set USDC Allocation
                                </Button>
                              </Form>
                            </div>
                        </Col>
                      </Row>
                    </Container>
                  </div>
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

function allocationSubmitHandler (tokenAddress, inputId, decimals, props) {
  const {account, traderPaired, dispatch} = props

  const amount = document.getElementById(inputId).value
  setTraderAllocation(account, tokenAddress, amount, decimals, traderPaired, dispatch)
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


