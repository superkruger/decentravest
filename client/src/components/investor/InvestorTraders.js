import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Alert } from 'react-bootstrap'
import InvestorTraderDetail from './InvestorTraderDetail'
import { 
  traderPairedSelector,
  investableTradersSelector
} from '../../store/selectors'

class InvestorTraders extends Component {

  render() {
    const {investableTraders} = this.props

    if (investableTraders.length === 0) {
      return (
        <Alert variant="info">
          Looks you are a VERY early investor ;) <br/>
          Hang in there, we're in the process of getting the best traders on board! <br/><br/>
          Please check in regularly for updates.
        </Alert>
      )
    }

    return (
      <Container>
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

function mapStateToProps(state) {

  return {
    traderPaired: traderPairedSelector(state),
    investableTraders: investableTradersSelector(state),
    state: state
  }
}

export default connect(mapStateToProps)(InvestorTraders)


