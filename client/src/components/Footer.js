import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'

import 'font-awesome/css/font-awesome.min.css';

class Footer extends Component {

  render() {
    return (
      <div className="sticky-footer bg-white">
        <div className="container my-auto">
          <br/>
          <Container>
            <Row>
              <Col sm={6}>
                <div className="copyright text-center my-auto">
                  <span>Copyright &copy; 2020 Decentravest - All Rights Reserved</span>
                </div>
              </Col>
              <Col sm={3}/>
              <Col sm={1}>
                <a href="https://t.me/decentravest" target="_blank" rel="noopener">
                  <i className="fa fa-telegram"></i>
                </a>
              </Col>
              <Col sm={1}>
                <a href="https://twitter.com/decentravest" target="_blank" rel="noopener">
                  <i className="fa fa-twitter"></i>
                </a>
              </Col>
              <Col sm={1}>
                <a href="https://www.youtube.com/channel/UCMcIEi_OZr5GWhtrzH3_uhQ" target="_blank" rel="noopener">
                  <i className="fa fa-youtube"></i>
                </a>
              </Col>
            </Row>
          </Container>
          <br/>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
  }
}

export default connect(mapStateToProps)(Footer)


