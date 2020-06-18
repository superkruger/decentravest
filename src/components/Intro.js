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
                <div className="card-header">
                  <div className="logo">
                    <img src={`${process.env.PUBLIC_URL}/android-chrome-192x192.png`} width="60" height="60" alt=""/>
                    <h1>Decentravest</h1>
                  </div>
                </div>
                <div className="card-body">
                  <Player
                    playsInline
                    poster={`${process.env.PUBLIC_URL}/img/explainer.png`}
                    src={`${process.env.PUBLIC_URL}/vid/explainer.mp4`}
                  />
                </div>
                <div className="card-footer badge">
                  Coming soon in 2020 (at least the year won't be that crappy)
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
