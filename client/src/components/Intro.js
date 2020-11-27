import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import Spinner from './Spinner'
import { info } from '../helpers'
import PageLink from './containers/PageLink'
import { Page } from './containers/pages'
import {
  ethereumInstalledSelector,
  web3Selector,
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
    const {ethereumInstalled, web3, isAdmin, traderPairedLoaded, joined} = this.props

    let content

    if (!ethereumInstalled) {
      content = (<InstallEthereum />)
    } else if (!web3) {
      content = (<ConnectEthereum />)
    } else if (!traderPairedLoaded) {
      content = (<Spinner />)
    } else if (!joined && !isAdmin) {
      content = (<JoinSelection props={this.props} />)
    } else {
      content = (<Members />)
    }

    return (
      <Container>
        <Row>
          <Col sm={12}>
            { 
              content
            }
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

function InstallEthereum() {
  return (
    <div>
      <h3>Install An Ethereum Wallet</h3>

      To use this app, you'll need an ethereum wallet, and a metamask extension.<br/>
      This app works best in <a href="https://brave.com" target="_blank" rel="noopener">Brave</a> or <a href="https://www.google.com/chrome/" target="_blank" rel="noopener">Chrome</a> browsers.<br/><br/>

      <h5>Installing Metamask</h5>
      <ol>
        <li>Go to the <a href="https://metamask.io" target="_blank" rel="noopener">Metamask</a> website.</li>
        <li>Click “Get Chrome Extension” to install Metamask.</li>
        <li>Click “Add to Chrome” in the upper right.</li>
        <li>Click “Add Extension” to complete the installation.</li>
      </ol>

      You will know Metamask has been installed when you see the fox logo on the upper right hand corner of your browser.<br/><br/>

      Here's a more in-depth <a href="https://blog.wetrust.io/how-to-install-and-use-metamask-7210720ca047" target="_blank" rel="noopener">article</a>
    </div>
  )
}

function ConnectEthereum() {
  return (
    <div>
      <h3>Connect Your Wallet</h3>

      To unlock all functionality, you'll need to connect your wallet to this app.<br/>
      Click the button top-right.
    </div>
  )
}

function Members() {
  return (
    <div>
      <h3>Welcome to the Decentravest portal for traders and investors</h3>
    </div>
  )
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
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "5rem"}} src="/img/trader.jpg" alt=""/>
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
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "5rem"}} src="/img/investor.jpg" alt=""/>
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
    ethereumInstalled: ethereumInstalledSelector(state),
    web3: web3Selector(state),
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
