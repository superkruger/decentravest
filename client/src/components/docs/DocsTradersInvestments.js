
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Container, Row, Col } from 'react-bootstrap'

class DocsTradersInvestments extends Component {

  render() {
    
    return (
      <Container>
      	<Row>
          <Col sm={12}>
            <h1>The Trading Road to Success</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            As a trader, you'll be required to have both Collateral and Direct investments from investors.<br/>
            Sporadic Collateral investments can be seen as a challenge in order to gain a good reputation in the system so you can attract Direct investments.<br/>

            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "30rem"}} src="/docs/img/road-to-success.jpg" alt=""/><br/>

            Collateral investments are used to set the baseline for how much capital you trade with, so that your relative profit ratings can be calculated automatically.<br/>
            The better your profit ratings, the more Direct investments you'll receive, which means more profit.<br/><br/>
            You can start getting Direct investments after completing your first Collateral investment.<br/>
            You're free to experiment with different profit percentage settings, making them more or less profitable. It's a free market!<br/><br/>
            As you progress with a positive reputation, more and more Direct investments will be allowed, making trading more profitable for both you and the investors.<br/>
            Below, the differences between Collateral and Direct investments are explained.<br/><br/>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <h3>So, how does it work?</h3>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            The goal for traders is to eventually reach a point where they are allowed 1000X their own trading capital in Direct investments.<br/>
            The Direct limit increases gradually as they complete more investments.<br/>
            <div>
            <video class="video" width="640" height="480" controls poster="/docs/vid/Collateral_vs_Direct.png">
              <source src="/docs/vid/Collateral_vs_Direct.mp4" type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
            </div>
            Collateral investments are used as a mechanism for the platform to determine what constitutes a trader's own capital amount.<br/>
            By letting the trader set their own Collateral limit, they indicate how much they trade with, and sets a limit to how much Collateral investment they can get.<br/>
            Profitable Collateral investments would increase the Direct limits they can get automatically, thereby creating a level playing field for all traders, and rewarding the best performing and most trustworthy ones.<br/><br/>
            The reason for this is that we need a mechanism for trader validation without actually having to centrally validate them. The Collateral/Direct system feeds a rating system that provides the checks and balances required to make Decentravest attractive to both traders and investors.<br/>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <h1>Collateral Investments</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            Without requiring any action on your part, investors will find your profile and invest in you, for the purposes of trading.<br/>
            When that happens, you'll see new investments appear under the Investments menu.<br/>

            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/trader_collateral_investment_new.png" alt=""/><br/>

            Initially, the investment profit will be zero, as it requires trades to be made after the investment has started.<br/>
            With every new trade (opened and closed) you'll see the profit changing in relation to the investment size with that of your collateral limit and other investments.<br/>

            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/trader_collateral_investment_profit.png" alt=""/><br/>

            Both your profit, and the investor profit is shown on top, while relevant trades are shown below.<br/><br/>
          	<h3>How are profits calculated?</h3>
          	For collateral investments, it depends on 4 factors:<br/>
          	<ul>
          		<li>The profit percentage setting</li>
          		<li>The size of your collateral limit</li>
          		<li>The size of the investment in relation to the collateral limit</li>
          		<li>The profits of all trades qualifying for this investment (same base token and within investment lifespan)</li>
          	</ul>
          	In this case, the profit percentage for investors is 20%<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "10rem"}} src="/docs/img/profitpercentages.png" alt=""/><br/>
            And the collateral limit is 1 ETH<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "6rem"}} src="/docs/img/collaterallimits.png" alt=""/><br/><br/>
            
            That means, investors will get 0.2 / 1, or 1/5th of all profits, and because it's a collateral investment, they'll get 20%, while you keep 80%.<br/>
            Thus, for a total of 0.7 ETH trading profit, this investor will get 0.028 ETH, minus 1% platform fees, resulting in 0.0277 ETH<br/><br/>
            For this investment your profit is 0.1109 ETH, calculated the same way.<br/>
            You'll notice a (seeming) discrepancy between the trading profits (0.7 ETH) and the total investment profits (0.14 ETH).<br/>
            That's because this investment only counts towards 1/5th (portion of collateral limits) of all trading profit.<br/>
            The difference stays in your trading wallet, and isn't reckoned here.<br/><br/>

            Eventually, the investor will request a disbursal, and you'll see a notification icon informing you of action that needs to be taken.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/trader_investment_action_required.png" alt=""/><br/>
            
            From the time of the request, you'll have 7 days to approve it, before your trust rating starts declining.<br/>
            In the unlikely event that the incorrect value has been requested, you'll have the option to reject the disbursal request.<br/>
            Once you approve the request, it will include the profit amount payable from the multisig collateral wallet.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/trader_collateral_investment_approve.png" alt=""/><br/>
            
            In the case of overall trading losses, approval will result in a payment made to you for some portion of the losses made.<br/><br/>
            You have the option to stop the investment and request the disbursal yourself, which the investor then has to approve, but bear in mind that it will have some consequences for your trust rating, so use only when you plan to stop trading for long periods, or alltogether.
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
            The biggest difference is that as soon as the investment has been created, all funds have already been transferred directly to your trading wallet.<br/>
            And by default, the investor will earn 80% of applicable trading profits.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/trader_direct_investment_profit.png" alt=""/><br/>
            
            Thus, any trades that you perform afterward will be assumed to be done with the inclusion of the investment capital.<br/>
            Of course, trading strategy is still up to your own discretion, with regards to what portion of the investment capital you trade with, and what portion you leave for a buffer.<br/><br/>
            Like Collateral investments, you'll receive a disbursement request.<br/>
            Unlike Collateral investments, once you approve the request, it will include the profit amount payable from your trading wallet.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/trader_direct_investment_approve.png" alt=""/><br/>
            
            In the case of overall trading losses, approval will result in a payment made to you for some portion of the losses made.
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

export default connect(mapStateToProps)(withRouter(DocsTradersInvestments))
