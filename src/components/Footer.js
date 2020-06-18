import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col } from 'react-bootstrap'

import 'font-awesome/css/font-awesome.min.css';

class Footer extends Component {

  render() {
    return (
      <div>
        <div className="footer">
          <br/>
          <Container>
            <Row>
              <Col sm={6}>
                © 2020 Decentravest - All Rights Reserved
              </Col>
              <Col sm={6}>
                <a href="https://twitter.com/decentravest" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-twitter"></i>
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


