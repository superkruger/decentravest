import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button } from 'react-bootstrap'
import {
  traderPairedSelector,
  traderPairedLoadedSelector,
  traderSelector,
  investorSelector,
  traderJoiningSelector,
  investorJoiningSelector
} from '../store/selectors'
import { 
  pageSelected
} from '../store/actions'

class Intro extends Component {

  render() {
    return (
      <div>
        <Container>
          <Row>
            <Col sm={12}>
              <div className="card bg-light text-dark">
                
                <div className="card-body">
                  <h3>Welcome to the Decentravest portal for traders and investors</h3>
                  <p>You'll need to have a Metamask wallet extension in your browser connected to the mainnet</p>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <div>
                { !this.props.traderPairedLoaded ? 
                  <div>
                    <div>
                    {
                      (typeof window.ethereum !== 'undefined') ?
                        <ConnectButton /> :
                      <span>Please install <a href="metamask.io" target="_blank" rel="noopener">Metamask</a></span>
                    }
                    </div>
                  </div> : 
                  
                    !this.props.joined ?
                    
                    <JoinButton props={this.props} /> :

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
      </div>
    )
  }
}



function ConnectButton(props) {
  const handleClick = () => window.ethereum.request({ method: 'eth_requestAccounts' })

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

function JoinButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('join'));

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Join Now!
      </Button>
    </div>
  );
}

function mapStateToProps(state) {
  const trader = traderSelector(state)
  const investor = investorSelector(state)

  return {
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor
  }
}

export default connect(mapStateToProps)(Intro)
