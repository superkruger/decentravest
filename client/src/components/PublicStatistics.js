import { get } from 'lodash'
import React, { Component } from 'react'
import {isEqual} from 'lodash'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Spinner from './Spinner'
import SmallNumber from './cards/SmallNumber'
import SmallCurrencyAmounts from './cards/SmallCurrencyAmounts'
import AddressLink from './AddressLink'
import PageLink from './containers/PageLink'

import { 
  networkSelector,
  publicStatisticsSelector
} from '../store/selectors'
import { 
  loadPublicStatistics
} from '../store/interactions'
import { ZERO_ADDRESS, displaySymbol } from '../helpers'

class PublicStatistics extends Component {
  componentDidMount() {
    const { network, dispatch } = this.props

    if (network) {
      loadPublicStatistics(network, dispatch)
    }
  }

  componentDidUpdate(prevProps) {
    const { network, dispatch } = this.props

    if (!isEqual(network, prevProps.network)) {
      loadPublicStatistics(network, dispatch)
    }
  }

  render() {
    const {publicStatistics} = this.props

    if (!publicStatistics) {
      return (
        <Spinner />
      )
    }

    const traderCount = get(publicStatistics, 'traderCount', 0)
    const investorCount = get(publicStatistics, 'investorCount', 0)

    return (
      <div className="col-sm-12">
        <Container>
          <Row>
            <Col sm={6}>
              <Alert variant="info">
                Sign up as a trader before the end of 2020, and get 100% off on fees for the entire 2021 !!<br/>
                Sign up between January and March of 2021 and get 50% off.
              </Alert>
            </Col>
            <Col sm={6}>
            </Col>
          </Row>
          <Row>
            <Col sm={6}>
              <SmallNumber title="Active Traders" amount={traderCount} icon="fa-chart-line" border="primary" />
            </Col>
            <Col sm={6}>
              <SmallNumber title="Investors" amount={investorCount} icon="fa-coins" border="primary" />
            </Col>
          </Row>
          <Row>
            <Col sm={12}>
              More statistics coming soon...
            </Col>
          </Row>

          
          
        </Container>
        
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {

  return {
    network: networkSelector(state),
    publicStatistics: publicStatisticsSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(PublicStatistics))
