import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import { info } from '../helpers'
import {
  traderPairedSelector,
  traderPairedLoadedSelector,
  accountSelector,
  traderSelector,
  investorSelector,
  isAdminSelector
} from '../store/selectors'
import { 
  pageSelected,
  notificationAdded
} from '../store/actions'

class Intro extends Component {

  render() {
    const {isAdmin, traderPairedLoaded, joined} = this.props
    return (
        <Container>
          <Row>
            <Col sm={12}>
              <div className="card bg-light text-dark">
                
                <div className="card-body">
                  <h3>Welcome to the Decentravest portal for traders and investors</h3>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <div>
                { !traderPairedLoaded ? 
                  <div>
                    <div>
                    {
                      (typeof window.ethereum !== 'undefined') ?
                        <ConnectButton props={this.props} /> :
                      <span>
                        Please install <a href="https://metamask.io" target="_blank" rel="noopener">Metamask</a> first.
                      </span>
                    }
                    </div>
                  </div> : 
                  
                    !joined && !isAdmin ?
                    
                    <JoinSelection props={this.props} /> :

                    <div/>
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



function ConnectButton(props) {
  const { dispatch } = props.props

  const handleClick = () => {
    dispatch(notificationAdded(info("metamask", "Connecting...")))
    window.ethereum.request({ method: 'eth_requestAccounts' })
  }

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Connect Metamask
      </Button>
    </div>
  );
}

function JoinSelection(props) {
  return (
    <Container>
      <Row>
        <Col sm={5} className="text-align-center">
          <div className="card bg-light text-dark">
            <div className="card-header">
              Are you an experienced trader?
            </div>
            <div className="card-body">
              <JoinTraderButton props={props.props} />
            </div>
          </div>
        </Col>
        <Col sm={2} className="text-align-center">
          <h1>OR</h1>
        </Col>
        <Col sm={5} className="text-align-center">
          <div className="card bg-light text-dark">
            <div className="card-header">
              Would you just like to invest?
            </div>
            <div className="card-body">
              <JoinInvestorButton props={props.props} />
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  )
}

function JoinTraderButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('jointrader'));

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Join Now as a Trader!
      </Button>
    </div>
  );
}

function JoinInvestorButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('joininvestor'));

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Join Now as an Investor!
      </Button>
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
