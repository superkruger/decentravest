import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Badge } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import Token from '../Token'
import InvestorInvestment from './InvestorInvestment'
import { log, toBN, uniqueByKey } from '../../helpers'
import { 
  accountSelector,
  investorSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  walletSelector,
  tokensSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  rejectDisbursement,
  loadInvestmentValues
} from '../../store/interactions'
import { 
  loadTraderPositions
} from '../../store/dydxInteractions'


class InvestorInvestments extends Component {
  componentDidMount() {
    const { investments, traderPaired, dispatch } = this.props
    loadInvestmentValues(investments, traderPaired, dispatch)

    const traderInvestments = uniqueByKey(investments, it => it.trader)

    console.log("traderInvestments", traderInvestments)

    traderInvestments.forEach(async (investment) => {
      await loadTraderPositions(investment.trader, dispatch)
    })
  }

  render() {
    const {investments} = this.props
    return (
      <Container>
        <Row>
          <Col sm={12}>  
            { 
              investments.map((investment) => {
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

function mapStateToProps(state) {

  return {
    account: accountSelector(state),
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state),
    wallet: walletSelector(state),
    tokens: tokensSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorInvestments)


