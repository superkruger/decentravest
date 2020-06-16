import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Carousel, Container, Row, Col } from 'react-bootstrap'

class Intro extends Component {

  render() {
    return (
      <div>
        <Container>
        <Row>
          <Col sm={12}>
            <header className="App-header">
            Decentravest
            </header>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <Carousel>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={`${process.env.PUBLIC_URL}/img/s1.jpg`}
              alt="decentralised"
            />
            <Carousel.Caption>
              <h3>Truly decentralised crypto investment</h3>
              <p>Investment services based on smart contracts and distributed providers</p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={`${process.env.PUBLIC_URL}/img/s2.jpg`}
              alt="avoid scams"
            />
            <Carousel.Caption>
              <h3>Avoid exit scams</h3>
              <p>
                Crypto investment services like Amfeix has come under much deserved scrutiny.
                Being centralised, their service relies on central trust.
                We minimise that risk through distributed trust.
              </p>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100"
              src={`${process.env.PUBLIC_URL}/img/s3.jpg`}
              alt="transparent"
            />
            <Carousel.Caption>
              <h3>Open and transparent</h3>
              <p>
                Easy access, all you need is an ethereum wallet.
                Source code for everything will be available, as well as all transaction data.
              </p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            <footer className="App-footer">
            Coming soon... 2020
            </footer>
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
