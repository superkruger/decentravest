import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import AddressImage from '../AddressImage'
import Token from '../Token'
import Spinner from '../Spinner'
import { ZERO_ADDRESS, formatBalance } from '../../helpers'
import { 
  traderSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  walletSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement
} from '../../store/interactions'

class TraderInvestments extends Component {

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
        console.log(investment)
        return (
          <div className="card shadow mb-4" key={investment.id}>
            <a href="#investments" className="d-block card-header py-3" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="investments">
              <h6 className="m-0 font-weight-bold text-primary">
                <Row>
                  <Col sm={3}>
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
            <div className="collapse show" id="investments">
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
  const { trader, dispatch } = props.props
  const { investment } = props

  disburseInvestment(trader.user, investment, investment.walletContract, dispatch)
}

function ApproveButton (props) {
  return (
    <Button variant="primary" onClick={(e) => {approveHandler(props)}}>
      Approve
    </Button>
  )
}

function approveHandler (props) {
  const { trader, dispatch } = props.props
  const { investment } = props

  approveDisbursement(trader.user, investment, investment.walletContract, dispatch)
}

function mapStateToProps(state) {

  return {
    trader: traderSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state)
  }
}

export default connect(mapStateToProps)(TraderInvestments)


