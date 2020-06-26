import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'
import { Player } from 'video-react'

class Intro extends Component {

  render() {
    return (
      <div>
        <Container>
          <Row>
            <Col sm={12}>
              <div className="card bg-light text-dark">
                
                <div className="card-body">
                  <Player
                    playsInline
                    poster={`${process.env.PUBLIC_URL}/img/explainer.png`}
                    src={`${process.env.PUBLIC_URL}/vid/explainer.mp4`}
                  />
                </div>
                <div className="card-footer badge">
                  We're launching in phases, see below for a timeline
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <div className="tl">
                <div className="tl-container tl-left">
                  <div className="tl-content">
                    <h2>First batch of traders</h2>
                    <p>
                      <em>(Now Open!)</em><br/>
                      Are you a successful trader on <a href="https://trade.dydx.exchange/margin" target="_blank" rel="noopener">dydx.exchange</a>?<br/>
                      Would you like to trade risk-free?<br/><br/>
                      Sign up with your Metamask wallet that you use for trading, and you'll be entered into the pool.<br/>
                      For now, we <strong>ONLY</strong> support Isolated Margin trades with ETH, DAI or USDC.
                    </p>
                  </div>
                </div>
                <div className="tl-container tl-right">
                  <div className="tl-content">
                    <h2>Trader selection</h2>
                    <p>We'll select the best traders from the pool to partake in the first opening phase.</p>
                  </div>
                </div>
                <div className="tl-container tl-left">
                  <div className="tl-content">
                    <h2>First batch of investors</h2>
                    <p>
                      Each of the selected traders will have a limited number of slots available for investors.<br/><br/>
                      Investors will need some minimum amount to invest, and this first investment phase will continue until we're satisfied everything works properly.
                    </p>
                  </div>
                </div>
                <div className="tl-container tl-right">
                  <div className="tl-content">
                    <h2>Open season</h2>
                    <p>We'll open the platform to all traders and investors.</p>
                  </div>
                </div>
                <div className="tl-container tl-left">
                  <div className="tl-content">
                    <h2>Opaque trading pool</h2>
                    <p>
                      From an Investors point of view, being able to choose the best Traders is great.<br/>
                      But what if we can make investing even easier?
                      Simply join as an Investor and earn profits from the trading pool.
                    </p>
                  </div>
                </div>
                <div className="tl-container tl-right">
                  <div className="tl-content">
                    <h2>Decentralised Governance</h2>
                    <p>
                      While the platform, trading and participants are all decentralised, there's still one area of improvement.<br/>
                      We need to decentralise governance of the platform too, meaning all decisions are put to a vote by participants.<br/>
                      That way, the stakeholders not only get complete transparency, but also complete control.
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>

        </Container>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
  }
}

export default connect(mapStateToProps)(Intro)
