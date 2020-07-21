import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import AddressImage from '../AddressImage'
import Spinner from '../Spinner'
import InvestorTraderDetail from './InvestorTraderDetail'
import { ZERO_ADDRESS, formatBalance, etherToWei } from '../../helpers'
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
                    <Trader props={this.props} trader={trader} key={trader.user}/>
                )
              })
            }
          </Col>
        </Row>
      </Container>
    )
  }
}


function Trader(props) {
  const { trader } = props

  console.log("Trader", trader)

  return (
    <div className="card shadow mb-4">
      <a href={`#trader_${trader.user}`} className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`trader_${trader.user}`}>
        <h6 className="m-0 font-weight-bold text-primary"><AddressImage address={trader.user}/></h6>
      </a>
      <div className="collapse" id={`trader_${trader.user}`}>
        <div className="card-body">
          <InvestorTraderDetail trader={trader}/>
        </div>
      </div>
    </div>
  )
}

function mapStateToProps(state) {

  return {
    traderPaired: traderPairedSelector(state),
    traders: tradersSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorTraders)


