
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Container, Row, Col } from 'react-bootstrap'

class DocsTradersSettings extends Component {

  render() {
    
    return (
      <Container>
        <Row>
          <Col sm={12}>
            <h1>Profit Percentages</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            This is where you set the percentage of profit an investor will receive per investment type.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "10rem"}} src="/docs/img/profitpercentages.png" alt=""/><br/><br/>
            There are two types of investment:
          </Col>
        </Row>
        <Row>
          <Col sm={6}>
            <h2>Collateral</h2>
          </Col>
          <Col sm={6}>
            <h2>Direct</h2>
          </Col>
        </Row>
        <Row>
          <Col sm={5}>
            Collateral investments are the safest type for investors, as the funds are stored in a multisig wallet to which you, the investor, and the platform has keys, and so single actor can extract the funds alone.<br/>
            You trade with your own funds, using the collateral in the investment only to recoup trading losses, proportional to the collateral limit set.<br/><br/>
            By default, the investor receives 20% of all trading profits, proportional to the size of the investment to the collateral limit.
          </Col>
           <Col sm={5}>
            Direct investments are more risky for investors, as the funds are sent directly to your trading wallet, for you to trade with.<br/>
            As with collateral investments, trading losses can also be recouped proportional to the size of the investment.<br/><br/>
            By default, the investor receives 80% of all trading profits, proportional to the size of the investment.
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <h1>Collateral Limits</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            In order to be listed as an active trader, you'll need to set collateral limits per currency.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "6rem"}} src="/docs/img/collaterallimits.png" alt=""/><br/><br/>
            The limit serves as an upper limit to collateral investments you can receive, and is an indication of the actual amount of currency you trade with.<br/>
            Setting it to zero, makes investments for that currency impossible.<br/><br/>
            You can set the limits to any amount, but bear in mind there are consequences for huge discrepancies between the limit and the amount you trade with:<br/>
            <Row>
	          <Col sm={4}>
	            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "15rem"}} src="/docs/img/Collateral_Limit_Explanation.png" alt=""/>
	          </Col>
	          <Col sm={8}>
	            Setting it too high, will result in more investments, lower profit returns for investors, but also smaller losses per investor for collateral recoups.<br/>
            	Setting it too low, will result in fewer investments, higher profit returns for investors, but also larger losses per investor for collateral recoups.<br/>
            	Set it as close to your trading amounts as possible, and update regularly for best results.<br/>
            	As your own trading capital naturally grows with profits made, the collateral limit will drift lower in relation.
            	Slightly lower means your profit ratings will be slightly better, so only periodic updates are necessary when the discrepancy becomes too big.<br/>
            	It's up to you to decide what constitutes "too big a difference".
	          </Col>
	        </Row>
          </Col>
        </Row><Row>
          <Col sm={12}>
            <h1>Direct Limits</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            This is set automatically by the system.<br/>
            If you maintain sufficient profitable collateral investments, and a good trust rating, the rating system will steadily increase your direct investment limits.<br/>
            Thus, the better your performance and trust ratings, the more funds you can receive from investors.
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

export default connect(mapStateToProps)(withRouter(DocsTradersSettings))
