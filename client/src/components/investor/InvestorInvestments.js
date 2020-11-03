import { isEqual, sortBy } from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Badge, Form, Alert } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Token from '../Token'
import Help from '../containers/Help'
import InvestorInvestment from './InvestorInvestment'
import { 
  log, 
  toBN, 
  uniqueByKey,
  INVESTMENT_STATE_INVESTED,
  INVESTMENT_STATE_STOPPED,
  INVESTMENT_STATE_EXITREQUESTED_INVESTOR,
  INVESTMENT_STATE_EXITREQUESTED_TRADER,
  INVESTMENT_STATE_EXITAPPROVED
} from '../../helpers'
import { 
  networkSelector,
  accountSelector,
  investorSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  walletSelector,
  tokensSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  rejectDisbursement,
  loadTrades
} from '../../store/interactions'


class InvestorInvestments extends Component {
  constructor(props) {
    super(props);
    this.state = {pastInvestmentsFilter: false, currentInvestmentsFilter: true};
  }

  componentDidMount() {
    const { network, investments, traderPaired, dispatch } = this.props

    const traderInvestments = uniqueByKey(investments, it => it.trader)

    traderInvestments.forEach(async (investment) => {
      await loadTrades(network, investment.trader, dispatch)
    })
  }

  componentDidUpdate(prevProps) {
    const { network, investments, traderPaired, dispatch } = this.props

    if (network !== prevProps.network || traderPaired !== prevProps.traderPaired || !isEqual(sortBy(investments), sortBy(prevProps.investments))) {
      
      const traderInvestments = uniqueByKey(investments, it => it.trader)

      traderInvestments.forEach(async (investment) => {
        await loadTrades(network, investment.trader, dispatch)
      })
    }
  }

  render() {
    const {investments, investmentActionRequired} = this.props
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
            { 
              investments.map((investment) => {
                
                if (investment.state === INVESTMENT_STATE_EXITAPPROVED && !this.state.pastInvestmentsFilter) {
                  return null
                }

                if (investment.state !== INVESTMENT_STATE_EXITAPPROVED && !this.state.currentInvestmentsFilter) {
                  return null
                }
        
                return (
                  <InvestorInvestment investment={investment} key={investment.id}/>
                )
              })
            }
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

function mapStateToProps(state) {

  return {
    network: networkSelector(state),
    account: accountSelector(state),
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state),
    wallet: walletSelector(state),
    tokens: tokensSelector(state),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorInvestments)


