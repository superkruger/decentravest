import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Badge, Alert, Form } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Token from '../Token'
import Help from '../containers/Help'
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
  traderSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  tokensSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  rejectDisbursement
} from '../../store/interactions'

class TraderInvestments extends Component {
  constructor(props) {
    super(props);
    this.state = {pastInvestmentsFilter: false, currentInvestmentsFilter: true};
  }

  render() {
    const {investmentActionRequired} = this.props

    return (
      <Container>
        <Row>
          <Col sm={1}>
            <Help helpKey="investments" title="Investments" content="All your investments are listed here. Use the filters to control which of them is visible." />
          </Col>
          <Col sm={11}>
            {
              investmentActionRequired
              ?
                <Alert variant="warning">
                  Some of the investments require your attention
                </Alert>
              :
                <div/>
            }
          </Col>
        </Row>
        <Row>
          <Col sm={12}>  
            <Form>
              <Form.Check 
                inline
                type="switch"
                id="past-investments-filter"
                label="Past Investments"
                onChange={(e) => {switchFilterPastInvestments(e, this)}}
              />
              <Form.Check 
                inline
                defaultChecked
                type="switch"
                id="current-investments-filter"
                label="Current Investments"
                onChange={(e) => {switchFilterCurrentInvestments(e, this)}}
              />
            </Form>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>  
            { showInvestments(this) }
          </Col>
        </Row>
      </Container>
    )
  }
}

function switchFilterPastInvestments (event, component) {
  component.setState({pastInvestmentsFilter: event.target.checked})
}

function switchFilterCurrentInvestments (event, component) {
  component.setState({currentInvestmentsFilter: event.target.checked})
}

function showInvestments(component) {
  const { investments } = component.props

  return (
    <div className="col-sm-12">
    { investments.map((investment) => {
        const headerClass = investment.state === INVESTMENT_STATE_EXITAPPROVED ? "disbursed" : ""

        if (investment.state === INVESTMENT_STATE_EXITAPPROVED && !component.state.pastInvestmentsFilter) {
          return null
        }
        
        if (investment.state !== INVESTMENT_STATE_EXITAPPROVED && !component.state.currentInvestmentsFilter) {
          return null
        }
        
        return (
          <div className="card shadow mb-4" key={investment.id}>
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
                    <span className={`text-${investment.profitClass}`}>Gross Value: {investment.formattedGrossValue}</span>
                  </Col>
                  <Col sm={3}>
                    <span className={`text-${investment.profitClass}`}>Nett Value: {investment.formattedNettValue}</span>
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
              <div className="card-body">
                <Row>
                  <Col sm={8}>
                  {
                    {
                      0: <StopButton investment={investment} props={component.props} />,
                      1: <DisburseButton investment={investment} props={component.props} />,
                      2: <ApproveButton investment={investment} props={component.props} />,
                      3: <ApproveButton investment={investment} props={component.props} />,
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
              </div>
            </div>
          </div>
        )
      })
    }
    </div>
  )
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
  const { network, trader, web3, dispatch } = props.props
  const { investment } = props

  stopInvestment(network, trader.user, investment, investment.walletContract, web3, dispatch)
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
  const { network, trader, tokens, pairedInvestments, web3, dispatch } = props.props
  const { investment } = props

  const token = tokens.find(t => t.contract.options.address === investment.token)

  disburseInvestment(network, trader.user, investment, investment.walletContract, token, pairedInvestments, web3, dispatch)
}

function ApproveButton (props) {
  const { investment } = props

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
  const { network, trader, tokens, pairedInvestments, web3, dispatch } = props.props
  const { investment } = props

  log("--investment approve--", investment)

  const token = tokens.find(t => t.contract.options.address === investment.token)

  approveDisbursement(network, trader.user, investment, investment.walletContract, token, pairedInvestments, web3, dispatch)
}

function rejectHandler (props) {
  const { network, trader, pairedInvestments, web3, dispatch } = props.props
  const { investment } = props

  log("--investment reject--", investment)

  rejectDisbursement(network, trader.user, investment, investment.walletContract, pairedInvestments, web3, dispatch)
}

function mapStateToProps(state) {
  const account = accountSelector(state)

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
    account: account,
    trader: traderSelector(state, account),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state),
    tokens: tokensSelector(state),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(TraderInvestments)


