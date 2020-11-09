import moment from 'moment'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Spinner from '../Spinner'
import WalletInstruction from '../cards/WalletInstruction'

import {
  accountSelector, 
  traderSelector,
  traderPairedSelector,
  settingProfitSelector
} from '../../store/selectors'
import { 
  setProfitPercentages
} from '../../store/interactions'

class ProfitPercentages extends Component {

  render() {
    const {trader, traderPaired, settingProfit} = this.props

    if (!trader || !traderPaired) {
      return (
        <Spinner />
      )
    }

    return (
      <div className="card shadow mb-4">
        <div className="card-body">
        {
          settingProfit
          ? <Container>
              <Row>
                <Col sm={12}>
                  <WalletInstruction title="Confirm Profit Percentage" message="Please confirm the wallet action"/>
                </Col>
              </Row>
            </Container>
          : <Container>
              <Row>
                <Col sm={6}>
                  <Alert variant="info">
                    Set your investor profit percentages here. The higher the values, the more your investors will earn.
                  </Alert>
                </Col>
                <Col sm={6}>
                  <div>
                    <Form>
                      <Form.Group controlId="collateralProfit">
                        <Form.Label>Collateral Investment Profit</Form.Label>
                        <Form.Control type="number" placeholder="Investor profit for collateral investments" defaultValue={trader.investorCollateralProfitPercent} />
                      </Form.Group>
                      <Form.Group controlId="directProfit">
                        <Form.Label>Direct Investment Profit</Form.Label>
                        <Form.Control type="number" placeholder="Investor profit for direct investments" defaultValue={trader.investorDirectProfitPercent} />
                      </Form.Group>
                      <Button variant="primary" onClick={(e) => {profitSubmitHandler("collateralProfit", "directProfit", this.props)}}>
                        Set Profit Percentages
                      </Button>
                    </Form>
                  </div>
                </Col>
              </Row>
            </Container>
        }
        </div>
      </div>
    )
  }
}

function profitSubmitHandler (collateralInputId, directInputId, props) {
  const {account, traderPaired, dispatch} = props

  const collateralPercentage = document.getElementById(collateralInputId).value
  const directPercentage = document.getElementById(directInputId).value

  setProfitPercentages(account, collateralPercentage, directPercentage, traderPaired, dispatch)
}


function mapStateToProps(state, ownProps) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    page: ownProps.page,
    account: account,
    traderPaired: traderPaired,
    trader: traderSelector(state, account),
    settingProfit: settingProfitSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(ProfitPercentages))
