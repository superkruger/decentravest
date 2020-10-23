import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { info } from '../helpers'
import PageLink from './containers/PageLink'
import { Page } from './containers/pages'
import {
  traderPairedSelector,
  traderPairedLoadedSelector,
  accountSelector,
  traderSelector,
  investorSelector,
  isAdminSelector
} from '../store/selectors'
import { 
  notificationAdded
} from '../store/actions'

class Intro extends Component {

  render() {
    const {isAdmin, traderPairedLoaded, joined} = this.props
    return (
        <Container>
          <Row>
            <Col sm={12}>
              <div>
              { 
                traderPairedLoaded && (!joined && !isAdmin) ?
                
                <JoinSelection props={this.props} /> :

                <div>
                  <h3>Welcome to the Decentravest portal for traders and investors</h3>
                </div>
              }
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <p></p>
            </Col>
          </Row>
        </Container>
    )
  }
}

function JoinSelection(props) {
  return (
    <Container>
      <Row>
        <Col sm={12}>
          <div className="row no-gutters align-items-center">
            <div className="col mr-2">
              <div className="text-align-center text-xl h3 font-weight-bold text-info text-uppercase mb-1">Which one of these types describe you best?</div>
            </div>
          </div>
        </Col>
      </Row>
      <br/><br/>
      <Row>
        <Col sm={5} className="text-align-center">
          <JoinTraderButton props={props.props} />
        </Col>
        <Col sm={2} className="text-align-center">
          <br/><br/>
          <h1>OR</h1>
        </Col>
        <Col sm={5} className="text-align-center">
          <JoinInvestorButton props={props.props} />
        </Col>
      </Row>
    </Container>
  )
}

function JoinTraderButton(props) {

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">Experienced trader looking for investors</h6>
      </div>
      <div className="card-body">
        <div className="text-center">
          <PageLink page={Page.JOIN_TRADER}>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "10rem"}} src="/img/trader.jpg" alt=""/>
          </PageLink>
        </div>
      </div>
    </div>
  );
}

function JoinInvestorButton(props) {

  return (
    <div className="card shadow mb-4">
      <div className="card-header py-3">
        <h6 className="m-0 font-weight-bold text-primary">Investor looking to invest in good traders</h6>
      </div>
      <div className="card-body">
        <div className="text-center">
          <PageLink page={Page.JOIN_INVESTOR}>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "10rem"}} src="/img/investor.jpg" alt=""/>
          </PageLink>
        </div>
      </div>
    </div>
  );
}

function mapStateToProps(state) {
  const account = accountSelector(state)
  const trader = traderSelector(state, account)
  const investor = investorSelector(state)

  return {
    account: account,
    isAdmin: isAdminSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor
  }
}

export default connect(mapStateToProps)(Intro)
