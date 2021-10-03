
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Container, Row, Col } from 'react-bootstrap'

class DocsTradersTrading extends Component {

  render() {
    
    return (
      <Container>
        <Row>
          <Col sm={12}>
            <h1>Decentralised, Permissionless trading</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            Decentravest integrates seamlessly with decentralised, permissionless trading platforms that work with your ethereum wallet.<br/>
            Currently supported trading platforms:<br/><br/>
            <Row>
              <Col sm={4}>
                <h4>Platform</h4>
              </Col>
              <Col sm={4}>
                <h4>Supported Base (Margin) Tokens</h4>
              </Col>
              <Col sm={4}>
                <h4>Supported Trading Pairs</h4>
              </Col>
            </Row>
            <Row>
              <Col sm={4}>
                    <a href="https://trade.dydx.exchange/margin/ETH-DAI" target="_blank" rel="noopener"><img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "5rem"}} src="/docs/img/dydx.png" alt="dYdX"/></a>
              </Col>
              <Col sm={4}>
                <ul>
                  <li>ETH</li>
                  <li>DAI</li>
                  <li>USDC</li>
                </ul>
              </Col>
              <Col sm={4}>
                <ul>
                  <li>ETH-DAI</li>
                  <li>ETH-USDC</li>
                  <li>DAI-USDC</li>
                </ul>
              </Col>
            </Row>
            <Row>
              <Col sm={4}>
                    <a href="https://dmex.app/" target="_blank" rel="noopener"><img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "5rem"}} src="/docs/img/dmex.png" alt="dYdX"/></a>
              </Col>
              <Col sm={4}>
                <ul>
                  <li>ETH</li>
                  <li>DAI</li>
                </ul>
              </Col>
              <Col sm={4}>
                <ul>
                  <li>BTC-USD</li>
                  <li>ETH-USD</li>
                  <li>LTC-USD</li>
                  <li>XRP-USD</li>
                  <li>BCH-USD</li>
                  <li>ADA-USD</li>
                  <li>XLM-USD</li>
                  <li>XMR-USD</li>
                  <li>LINK-USD</li>
                  <li>ATOM-USD</li>
                </ul>
              </Col>
            </Row>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <h1>How it works</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            You simply trade on either or both platforms, using the same wallet you signed up with on decentravest, and using one of the supported base (margin) tokens to trade one of the supported pairs.<br/>
            Decentravest will monitor your profits and losses, and assign valuations to all investments in your portfolio based on the size of the investment.<br/><br/>
            When the investor eventually disburses their investment, you'll simply approve the request, and the platform will request you to make a profit payout to the investor in the case of overall trading profits, or you'll get proportional returns in the case of overall trading losses.
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

export default connect(mapStateToProps)(withRouter(DocsTradersTrading))
