import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Badge, Alert } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import EtherscanLink from '../containers/EtherscanLink'
import Token from '../Token'
import WalletInstruction from '../cards/WalletInstruction'
import { 
  log, 
  toBN, 
  INVESTMENT_COLLATERAL,
  INVESTMENT_STATE_INVESTED,
  INVESTMENT_STATE_STOPPED,
  INVESTMENT_STATE_EXITREQUESTED_INVESTOR,
  INVESTMENT_STATE_EXITREQUESTED_TRADER,
  INVESTMENT_STATE_EXITAPPROVED
} from '../../helpers'
import {
  web3Selector,
  networkSelector,
  accountSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  walletSelector,
  tokensSelector,
  tradesForInvestmentSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  rejectDisbursement
} from '../../store/interactions'

class TraderInvestment extends Component {

  render() {
    const { network, investment, tradesForInvestment } = this.props
    const headerClass = investment.state === INVESTMENT_STATE_EXITAPPROVED ? "disbursed" : ""

    const dydxUrl = process.env['REACT_APP_'+network+'_DYDX_CLOSED_URL'].replace('$1', investment.trader)

    return (
      <div className="card shadow mb-4">
        <a href={`#investments_${investment.id}`} className={`d-block card-header py-3 collapsed ${headerClass}`} data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`investments_${investment.id}`}>
          <h6 className="m-0 font-weight-bold text-primary">
            <Row>
              <Col sm={1}>
                {
                  investment.state === INVESTMENT_STATE_EXITREQUESTED_INVESTOR &&
                    <Badge variant="warning">!</Badge>
                }
                <AddressImage address={investment.investor}/>
              </Col>
              <Col sm={1}>
                <Token address={investment.token} />
              </Col>
              <Col sm={3}>
                <span>Amount: {investment.formattedAmount}</span>
              </Col>
              <Col sm={3}>
                <span className={`text-${investment.profitClass}`}>My Profit: {investment.formattedTraderProfit}</span>
              </Col>
              <Col sm={3}>
                <span className={`text-${investment.profitClass}`}>Investor Profit: {investment.formattedInvestorProfit}</span>
              </Col>
              <Col sm={1}>
                <span className="very-small text-right">
                  {investment.start.format('D-M-Y')}
                </span>
              </Col>
            </Row>
          </h6>
        </a>
        <div className="collapse" id={`investments_${investment.id}`}>
          <div className="card-header">
          {
            investment.investmentType === INVESTMENT_COLLATERAL
            ? <h4>Collateral Investment</h4>
            : <h4>Direct Investment</h4>
          }
          </div>
            {
              investment.changing
              ? <div className="card-body">
                  <Row>
                    <Col sm={6}>
                      <WalletInstruction title="Confirm Investment" message={investment.message}/>
                    </Col>
                  </Row>
                </div>
              : <div className="card-body">
                  <Row>
                    <Col sm={8}>
                    {
                      {
                        0: <StopButton props={this.props} />,
                        1: <DisburseButton props={this.props} />,
                        2: <ApproveButton props={this.props} />,
                        3: <ApproveButton props={this.props} />,
                        4: <div>Divested</div>
                      }[investment.state]
                    }
                    </Col>
                    <Col sm={4}>
                      <span className="very-small align-right">
                        <table>
                          <tbody>
                            <tr>
                              <td>Start:</td>
                              <td>{investment.formattedStart}</td>
                            </tr>
                            {
                              investment.end.unix() > 0 &&
                                <tr>
                                  <td>End:</td>
                                  <td>{investment.formattedEnd}</td>
                                </tr>
                            }
                          </tbody>
                        </table>
                      </span>
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={12}>
                    {
                      {
                        0: <EtherscanLink network={network} type="tx" address={investment.investTxHash} />,
                        1: <EtherscanLink network={network} type="tx" address={investment.stopTxHash} />,
                        2: <EtherscanLink network={network} type="tx" address={investment.requestTxHash} />,
                        3: <EtherscanLink network={network} type="tx" address={investment.requestTxHash} />,
                        4: <EtherscanLink network={network} type="tx" address={investment.approveTxHash} />
                      }[investment.state]
                    }
                    </Col>
                  </Row>
                  <Row>
                    <Col sm={12}>
                      <div className="card shadow mb-4">
                        <a href={`#investments_${investment.id}_trades`} className="d-block card-header py-2 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`investments_${investment.id}_trades`}>
                          <span className="m-0 font-weight-bold text-primary">Trades</span>
                        </a>
                        <div className="collapse" id={`investments_${investment.id}_trades`}>
                          <div className="card-body">
                            <a href={dydxUrl} target="_blank" rel="noopener">dydx positions</a>
                            <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Nett Profit</th>
                                </tr>
                              </thead>
                              <tbody>
                              {
                                tradesForInvestment.map((trade) => {
                                  return (
                                    <tr key={trade.id}>
                                      <td className="text-muted">{trade.formattedStart}</td>
                                      <td className={`text-${trade.profitClass}`}>{trade.formattedProfit}</td>
                                    </tr>
                                  )
                                })
                              }
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </Col>
                  </Row>
                </div>
            }
            
            
          
        </div>
      </div>
    )
  }
}

function StopButton (props) {
  return (
    <Row>
      <Col sm={2}>
        <Button variant="primary" onClick={(e) => {stopHandler(props)}}>
          Stop
        </Button>
      </Col>
      <Col sm={10}>
        <Alert variant="warning">
          Stopping an investment is irreversable. This would lock in the investment value until settlement is completed. Usually the investor would do this, but you can too in the event you want to cease trading.
        </Alert>
      </Col>
    </Row>
  )
}

function stopHandler (props) {
  const { network, account, investment, web3, dispatch } = props.props

  stopInvestment(network, account, investment, investment.walletContract, web3, dispatch)
}

function DisburseButton (props) {
  return (
    <Row>
      <Col sm={2}>
        <Button variant="primary" onClick={(e) => {disburseHandler(props)}}>
          Disburse
        </Button>
      </Col>
      <Col sm={10}>
        <Alert variant="info">
          To initiate settlement, you have to request a disbursal. The investor will have to approve the request.
        </Alert>
      </Col>
    </Row>
  )
}

function disburseHandler (props) {
  const { network, account, investment, tokens, pairedInvestments, web3, dispatch } = props.props

  const token = tokens.find(t => t.contract.options.address === investment.token)

  disburseInvestment(network, account, investment, investment.walletContract, token, pairedInvestments, web3, dispatch)
}

function ApproveButton (props) {
  const { investment } = props.props

  if (investment.state === INVESTMENT_STATE_EXITREQUESTED_TRADER) {
    return (
      <span>waiting for approval...</span>
    )
  }

  if (toBN(investment.value) === toBN(investment.grossValue)) {
    return (
      <Row>
        <Col sm={2}>
          <Button variant="primary" onClick={(e) => {approveHandler(props)}}>
            Approve
          </Button>
        </Col>
        <Col sm={10}>
          <Alert variant="info">
            The investor has requested a disbursal. If you see this, then the value requested is correct. You have to approve it for the settlement to complete.
          </Alert>
        </Col>
      </Row>
    )
  }

  return (
    <Row>
      <Col sm={2}>
        <Button variant="primary" onClick={(e) => {rejectHandler(props)}}>
          Reject
        </Button>
      </Col>
      <Col sm={10}>
        <Alert variant="warning">
          The investor has requested a disbursal with the wrong value ({investment.formattedValue}). This might indicate fraudulent action. It will be automatically investigated. The best course of action is to reject and issue a disbursal yourself.
        </Alert>
      </Col>
    </Row>
  )
}

function approveHandler (props) {
  const { network, account, investment, tokens, pairedInvestments, web3, dispatch } = props.props

  log("--investment approve--", investment)

  const token = tokens.find(t => t.contract.options.address === investment.token)

  approveDisbursement(network, account, investment, investment.walletContract, token, pairedInvestments, web3, dispatch)
}

function rejectHandler (props) {
  const { network, account, investment, pairedInvestments, web3, dispatch } = props.props

  log("--investment reject--", investment)

  rejectDisbursement(network, account, investment, investment.walletContract, pairedInvestments, web3, dispatch)
}

function mapStateToProps(state, props) {

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    wallet: walletSelector(state),
    tokens: tokensSelector(state),
    tradesForInvestment: tradesForInvestmentSelector(state, props.investment)
  }
}

export default connect(mapStateToProps)(TraderInvestment)


