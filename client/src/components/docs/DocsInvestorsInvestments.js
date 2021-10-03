
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Container, Row, Col } from 'react-bootstrap'

class DocsInvestorsInvestments extends Component {

  render() {
    
    return (
      <Container>
        <Row>
          <Col sm={12}>
            <h1>Collateral Investments</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            This is the safest form of investment, as the funds are stored in a multisig wallet to which you, the trader, and the platform has keys, and so single actor can extract the funds alone.<br/>
            The trader will trade with their own funds, so expect lower returns.<br/>
            Additionally, the funds can be used to recoup some of their trading losses in the case of overall trading losses for the investment.<br/><br/>
            To make the investment, find a trader, and invest a collateral amount.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/investor_collateral_investment_invest.png" alt=""/><br/>

            Initially, the investment profit will be zero, as it requires trades to be made after the investment has started.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/investor_collateral_investment_new.png" alt=""/><br/>

            With every new trade (opened and closed) you'll see the profit changing in relation to the investment size with that of the trader collateral limit and other investments.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/investor_collateral_investment_profit.png" alt=""/><br/>

            Eventually, you'll want to exit the investment, and for that you'll stop it first<br/> 
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "15rem"}} src="/docs/img/investor_collateral_investment_stopped.png" alt=""/><br/>
            then request a disbursal.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "15rem"}} src="/docs/img/investor_collateral_investment_disbursed.png" alt=""/><br/>

            From the time of the request, the trader will have 7 days to approve it, before their trust rating starts declining.<br/>
            Once the trader has approved the request, a payment will be made to you including the profit amount.<br/>
            In the case of overall trading losses, approval will result in a payment made from the collateral wallet to the trader for some portion of the losses made.<br/><br/>
            The trader also has the option to request a disbursal, which you'll have to approve, in case they wish to stop trading, for example.
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <h1>Direct Investments</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            Direct investments work essentially the same as Collateral investments.<br/>
            The biggest difference is that as soon as the investment has been created, all funds have already been transferred directly to the traders' trading wallet.<br/>
            And by default, you will earn 80% of applicable trading profits.<br/><br/>
            To make the investment, find a trader, and invest a direct amount.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "10rem"}} src="/docs/img/investor_direct_investment_invest.png" alt=""/><br/>

            Like Collateral investments, you'll need to stop the investment, and make a disbursement request to exit the investment.<br/>
          </Col>
        </Row>
      </Container>
    )
  }
}

function mapStateToProps(state, ownProps) {

  return {
  }
}

export default connect(mapStateToProps)(withRouter(DocsInvestorsInvestments))
