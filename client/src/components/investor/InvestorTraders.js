import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Alert, Form } from 'react-bootstrap'
import InvestorTraderDetail from './InvestorTraderDetail'
import { 
  networkSelector,
  traderPairedSelector,
  investableTradersSelector
} from '../../store/selectors'
import { 
  loadTraderStatistics
} from '../../store/interactions'

class InvestorTraders extends Component {
  constructor(props) {
    super(props);
    this.state = {filter: 'filterRadiosLevel'};
  }
  render() {
    const { investableTraders, network, dispatch } = this.props

    if (investableTraders.length === 0) {
      return (
        <Alert variant="info">
          Looks you are a VERY early investor ;) <br/>
          Hang in there, we're in the process of getting the best traders on board! <br/><br/>
          Please check in regularly for updates.
        </Alert>
      )
    } else {

      for(let i=0; i<investableTraders.length; i++) {
        if (!investableTraders[i].statistics) {
          loadTraderStatistics(investableTraders[i].user, network, dispatch)
          return null
        }
      }

      investableTraders.sort((a,b) => {

        console.log("--- sorting ---", a, b)

        switch(this.state.filter) {
          case 'filterRadiosLevel': {
            return a.statistics.level - b.statistics.level
            break
          }
          case 'filterRadiosTrust': {
            return a.statistics.trustRating - b.statistics.trustRating
            break
          }
        }
      })
    }

    return (
      <Container>
        <Row>
          <Col sm={12}>
            <fieldset>
              <Form.Group as={Row} onChange={(e) => {changeFilter(e, this)}}>
                <Form.Label as="legend">
                  Filter
                </Form.Label>
                <Form.Check
                  inline
                  defaultChecked
                  type="radio"
                  label="level"
                  name="filterRadios"
                  id="filterRadiosLevel"
                />
                <Form.Check
                  inline
                  type="radio"
                  label="trust rating"
                  name="filterRadios"
                  id="filterRadiosTrust"
                />
                <Form.Check
                  inline
                  type="radio"
                  label="trading performace"
                  name="filterRadios"
                  id="filterRadiosTrading"
                />
                <Form.Check
                  inline
                  type="radio"
                  label="profit performance"
                  name="filterRadios"
                  id="filterRadiosProfit"
                />
              </Form.Group>
            </fieldset>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            { 
              investableTraders.map((trader) => {
                return (
                    <InvestorTraderDetail trader={trader} key={trader.user}/>
                )
              })
            }
          </Col>
        </Row>
      </Container>
    )
  }
}

function changeFilter (event, component) {
  component.setState({filter: event.target.id})
}

function mapStateToProps(state) {

  return {
    network: networkSelector(state),
    traderPaired: traderPairedSelector(state),
    investableTraders: investableTradersSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorTraders)


