import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button, Badge } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import AddressImage from '../AddressImage'
import Token from '../Token'
import Spinner from '../Spinner'
import { ZERO_ADDRESS, formatBalance } from '../../helpers'
import { 
  accountSelector,
  investorSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  walletSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  loadInvestmentValues
} from '../../store/interactions'

class InvestorInvestments extends Component {
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
  const { account } = props

  return (
    <div>
    { investments.map((investment) => {
        console.log(investment)
        return (
          <div className="card shadow mb-4" key={investment.id}>
            <a href={`#investments_${investment.id}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`investments_${investment.id}`}>
              <h6 className="m-0 font-weight-bold text-primary">
                <Row>
                  <Col sm={3}>
                    {
                      investment.state == 2 && investment.from != account &&
                        <Badge variant="danger">!</Badge>
                    }
                    <AddressImage address={investment.trader}/>
                  </Col>
                  <Col sm={3}>
                    <Token address={investment.token} />
                  </Col>
                  <Col sm={3}>
                    <span>Amount: {investment.formattedAmount}</span>
                  </Col>
                  <Col sm={3}>
                    <span className={`text-${investment.profitClass}`}>Value: {investment.formattedValue}</span>
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
  const { investor, wallet, dispatch } = props.props
  const { investment } = props

  stopInvestment(investor.user, investment, wallet, dispatch)
}

function DisburseButton (props) {
  return (
    <Button variant="primary" onClick={(e) => {disburseHandler(props)}}>
      Disburse
    </Button>
  )
}

function disburseHandler (props) {
  const { investor, wallet, dispatch } = props.props
  const { investment } = props

  disburseInvestment(investor.user, investment, wallet, dispatch)
}

function ApproveButton (props) {
  const { account } = props.props
  const { investment } = props

  if (investment.from == account) {
    return (
      <span>waiting for approval...</span>
    )
  }

  return (
    <Button variant="primary" onClick={(e) => {approveHandler(props)}}>
      Approve
    </Button>
  )
}

function approveHandler (props) {
  const { investor, wallet, dispatch } = props.props
  const { investment } = props

  approveDisbursement(investor.user, investment, wallet, dispatch)
}

function mapStateToProps(state) {

  return {
    account: accountSelector(state),
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state),
    wallet: walletSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorInvestments)


