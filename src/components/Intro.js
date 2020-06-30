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
                  <h3>Welcome to the Decentravest portal for traders and investors</h3>
                  <p>You'll need to have a Metamask wallet extension in your browser connected to the mainnet</p>
                </div>
              </div>
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              <p></p>
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

function mapStateToProps(state) {
  return {
  }
}

export default connect(mapStateToProps)(Intro)
