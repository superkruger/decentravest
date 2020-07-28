import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Badge } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Token from '../Token'
import { log, toBN } from '../../helpers'
import { 
  accountSelector,
  traderSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  tokensSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  rejectDisbursement,
  loadInvestmentValues
} from '../../store/interactions'

class TraderInvestments extends Component {
  componentDidMount() {
    const { investments, traderPaired, dispatch } = this.props
    loadInvestmentValues(investments, traderPaired, dispatch)
  }

  render() {
    const {investments} = this.props
    return (
      <Container>
        <Row>
          <Col sm={12}>  
            { showInvestments(investments, this.props) }
          </Col>
        </Row>
      </Container>
    )
  }
}

function showInvestments(investments, props) {

  return (
    <div>
    { investments.map((investment) => {
        return (
          <div className="card shadow mb-4" key={investment.id}>
            <a href={`#investments_${investment.id}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`investments_${investment.id}`}>
              <h6 className="m-0 font-weight-bold text-primary">
                <Row>
                  <Col sm={1}>
                    {
                      investment.state === "2" &&
                        <Badge variant="danger">!</Badge>
                    }
                    <AddressImage address={investment.investor}/>
                  </Col>
                  <Col sm={2}>
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
                </Row>
              </h6>
            </a>
            <div className="collapse" id={`investments_${investment.id}`}>
              <div className="card-body">
                {
                  {
                    0: <StopButton investment={investment} props={props} />,
                    1: <DisburseButton investment={investment} props={props} />,
                    2: <ApproveButton investment={investment} props={props} />,
                    3: <ApproveButton investment={investment} props={props} />,
                    4: <div>Divested</div>
                  }[investment.state]
                }
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
    <Button variant="primary" onClick={(e) => {stopHandler(props)}}>
      Stop
    </Button>
  )
}

function stopHandler (props) {
  const { trader, dispatch } = props.props
  const { investment } = props

  stopInvestment(trader.user, investment, investment.walletContract, dispatch)
}

function DisburseButton (props) {
  return (
    <Button variant="primary" onClick={(e) => {disburseHandler(props)}}>
      Disburse
    </Button>
  )
}

function disburseHandler (props) {
  const { trader, tokens, pairedInvestments, dispatch } = props.props
  const { investment } = props

  log("--investment disburse--", investment)

  const token = tokens.find(t => t.contract.options.address === investment.token)

  disburseInvestment(trader.user, investment, investment.walletContract, token, pairedInvestments, dispatch)
}

function ApproveButton (props) {
  const { investment } = props

  if (investment.state === "3") {
    return (
      <span>waiting for approval...</span>
    )
  }

  if (toBN(investment.value) === toBN(investment.grossValue)) {
    return (
      <Row>
        <Col sm={12}>
          <Button variant="primary" onClick={(e) => {approveHandler(props)}}>
            Approve
          </Button>
        </Col>
      </Row>
    )
  }

  return (
    <Row>
      <Col sm={6}>
        <span>A disbursement value of {investment.formattedValue} has been requested</span>
      </Col>
      <Col sm={6}>
          <Button variant="primary" onClick={(e) => {rejectHandler(props)}}>
            Reject
          </Button>
      </Col>
    </Row>
  )
}

function approveHandler (props) {
  const { trader, tokens, pairedInvestments, dispatch } = props.props
  const { investment } = props

  log("--investment approve--", investment)

  const token = tokens.find(t => t.contract.options.address === investment.token)

  approveDisbursement(trader.user, investment, investment.walletContract, token, pairedInvestments, dispatch)
}

function rejectHandler (props) {
  const { trader, pairedInvestments, dispatch } = props.props
  const { investment } = props

  log("--investment reject--", investment)

  rejectDisbursement(trader.user, investment, investment.walletContract, pairedInvestments, dispatch)
}

function mapStateToProps(state) {

  return {
    account: accountSelector(state),
    trader: traderSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state),
    tokens: tokensSelector(state)
  }
}

export default connect(mapStateToProps)(TraderInvestments)


