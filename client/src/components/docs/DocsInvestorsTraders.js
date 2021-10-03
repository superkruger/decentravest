
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Container, Row, Col } from 'react-bootstrap'

class DocsInvestorsTraders extends Component {

  render() {
    
    return (
      <Container>
        <Row>
          <Col sm={12}>
            <h1>Finding Traders</h1>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>
            Decentravest gives you the opportunity to invest in the best and most trustworthy traders.<br/>
            The system relies on a four-pronged rating system, which you can read about in the rating documentation.<br/><br/>
            To find the best traders, go to the Traders page in the portal, and you'll see a list of currently active traders which you can sort on different rating criteria.<br/>
            <img className="img-fluid px-3 px-sm-4 mt-3 mb-4" style={{height: "20rem"}} src="/docs/img/investor_traders.png" alt=""/><br/>
            
            Once you've found a trader to your liking, simply click on the row to expand the investment section, where you can invest different assets, depending on what they trade with.<br/><br/>
            You're strongly advised to spread your investments over as many traders as you can to minimise risk.<br/>
            It also helps to disburse investments on a regular basis, to ensure traders act honestly, minimise risk, and feed the rating system.<br/>
            Decentravest is purely a marketplace to link traders with investors, and takes no responsibility for losses. Invest wisely and with caution!!
          </Col>
        </Row>
        
      </Container>
    )
  }
}

function mapStateToProps(state, ownProps) {

  return {
  }
}

export default connect(mapStateToProps)(withRouter(DocsInvestorsTraders))
