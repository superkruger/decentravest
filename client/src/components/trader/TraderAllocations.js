import React, { Component } from 'react'
import {isEqual} from 'lodash'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap'
import AllocationChart from './AllocationChart'
import Help from '../containers/Help'
import WalletInstruction from '../cards/WalletInstruction'
import { log, ZERO_ADDRESS, tokenDecimalsForAddress } from '../../helpers'
import { 
  web3Selector,
  networkSelector,
  accountSelector,
  traderSelector,
  traderPairedSelector,
  traderAllocationsSelector,
  tokensSelector,
  balancesSelector,
  hasValidAllocationSelector,
  allocatingsSelector
} from '../../store/selectors'
import { 
  loadTraderAllocations,
  setTraderAllocation,
  loadBalances,
  loadTraderStatistics
} from '../../store/interactions'

class TraderAllocations extends Component {

  componentDidMount() {
    const { network, account, trader, traderPaired, tokens, web3, dispatch } = this.props

    if (network && account && traderPaired && web3) {
      loadTraderAllocations(network, account, traderPaired, dispatch)
      loadBalances(account, traderPaired, tokens, web3, dispatch)

      if (trader && !trader.statistics) {
        loadTraderStatistics(trader.user, network, dispatch)
      }
    }
  }

  componentDidUpdate(prevProps) {
    const { network, account, trader, traderPaired, tokens, web3, dispatch } = this.props

    if (!isEqual(network, prevProps.network) || 
        !isEqual(account, prevProps.account) || 
        !isEqual(traderPaired, prevProps.traderPaired) || 
        !isEqual(web3, prevProps.web3)) {
      if (network && account && traderPaired && web3) {
        loadTraderAllocations(network, account, traderPaired, dispatch)
        loadBalances(account, traderPaired, tokens, web3, dispatch)

        if (trader && !trader.statistics) {
          loadTraderStatistics(trader.user, network, dispatch)
        }
      }
    }
  }

  render() {
    const {network, account, trader, hasValidAllocation, traderAllocations, allocatings} = this.props

    const allocationList = [
      {
        symbol: 'ETH',
        token: ZERO_ADDRESS
      },
      {
        symbol: 'DAI',
        token: process.env['REACT_APP_'+network+'_DAI_ADDRESS']
      },
      {
        symbol: 'USDC',
        token: process.env['REACT_APP_'+network+'_USDC_ADDRESS']
      }
    ]

    return (
        <Container>
          <Row>
            <Col sm={1}>
              <Help helpKey="allocation" title="Collateral Limits" content="Investors will only see you when you have collateral limits greater than 0.

                A collateral limit is an indication of how much currency you trade with.

                (Direct limits are set by the system when you attain at least level 1).

                Setting it too high will result in more investments, lower returns for investors, and fewer losses per investor in case of trading losses.

                Setting it too low will result in fewer investments, higher returns for investors, and larger losses per investor in case of trading losses.

                Set it to 0 any time to stop receiving investments." />
            </Col>
            <Col sm={11}>
              {
                !hasValidAllocation
                ?
                  <Alert variant="warning">
                    You need to set a colleral limit for at least one currency in order to be visible to investors.
                  </Alert>
                :
                  <div/>
              }
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              { 
                allocationList.map((allocation) => {
                  const traderAllocation = getTraderAllocation(allocation.token, traderAllocations)

                  const allocating = allocatings.find(sa => sa.id === `${allocation.token}`)
                  if (allocating) {
                    return (
                    <div className="card shadow mb-4" key={`${allocation.symbol}_${account}`}>
                      <a href={`#${allocation.symbol}${account}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`${allocation.symbol}${account}`}>
                        <Container>
                          <Row>
                            <Col sm={4}>
                              <h6 className="m-0 font-weight-bold text-primary">Collateral {allocation.symbol} Limit:</h6>
                            </Col>
                            <Col sm={8}>
                              {
                                traderAllocation && !traderAllocation.total.isZero()
                                ? <AllocationChart trader={account} token={allocation.token}/>
                                : <span>No limit set</span>
                              }
                            </Col>
                          </Row>
                        </Container>
                      </a>
                      <div className="collapse" id={`${allocation.symbol}${account}`}>
                        <div className="card-body">
                          <Container>
                            <Row>
                              <Col sm={6}>
                                <WalletInstruction title="Confirm Limit" message="Please confirm the wallet action"/>
                              </Col>
                            </Row>
                          </Container>
                        </div>
                      </div>
                    </div>
                    )
                  } else {
                    return (
                    <div className="card shadow mb-4" key={`${allocation.symbol}_${account}`}>
                      <a href={`#${allocation.symbol}${account}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`${allocation.symbol}${account}`}>
                        <Container>
                          <Row>
                            <Col sm={4}>
                              <h6 className="m-0 font-weight-bold text-primary">Collateral {allocation.symbol} Limit:</h6>
                            </Col>
                            <Col sm={8}>
                              {
                                traderAllocation && !traderAllocation.total.isZero()
                                ? <AllocationChart trader={account} token={allocation.token}/>
                                : <span>No limit set</span>
                              }
                            </Col>
                          </Row>
                        </Container>
                      </a>
                      <div className="collapse" id={`${allocation.symbol}${account}`}>
                        <div className="card-body">
                          <Container>
                            <Row>
                              <Col sm={6}>
                                {
                                  traderAllocation && !traderAllocation.total.isZero()
                                  ? <div>
                                      <span>Limit: {`${traderAllocation.formattedTotal}`}</span><br/>
                                      <span>Invested: {`${traderAllocation.formattedInvested}`}</span>
                                    </div>
                                  : <span></span>
                                }
                              </Col>
                              <Col sm={6}>
                                <div>
                                  <Balance props={this.props} symbol={allocation.symbol}/>
                                  <Form>
                                    <Form.Group controlId={`${allocation.symbol}_Amount`}>
                                      <Form.Control type="number" placeholder={`Enter ${allocation.symbol} Amount`} />
                                    </Form.Group>
                                    <Button variant="primary" onClick={(e) => {allocationSubmitHandler(allocation.token, allocation.symbol + "_Amount", this.props)}}>
                                      Set {allocation.symbol} Collateral Limit
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
    network: networkSelector(state),
    account: account,
    trader: traderSelector(state, account),
    traderPaired: traderPairedSelector(state),
    traderAllocations: traderAllocationsSelector(state, account),
    tokens: tokensSelector(state),
    balances: balancesSelector(state),
    hasValidAllocation: hasValidAllocationSelector(state, account),
    allocatings: allocatingsSelector(state)
  }
}

export default connect(mapStateToProps)(TraderAllocations)


