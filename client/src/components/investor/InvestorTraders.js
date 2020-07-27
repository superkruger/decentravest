import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'
import InvestorTraderDetail from './InvestorTraderDetail'
import { 
  traderPairedSelector,
  tradersSelector
} from '../../store/selectors'

class InvestorTraders extends Component {

  render() {
    const {traders} = this.props
    return (
      <Container>
        <Row>
          <Col sm={12}>
            { 
              traders.map((trader) => {
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
    traders: tradersSelector(state),
    state: state
  }
}

export default connect(mapStateToProps)(InvestorTraders)


