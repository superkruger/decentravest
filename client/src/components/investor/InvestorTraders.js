import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Alert, Form, InputGroup } from 'react-bootstrap'
import InvestorTraderDetail from './InvestorTraderDetail'
import { 
  networkSelector,
  traderPairedSelector,
  investableTradersSelector
} from '../../store/selectors'
import { 
  loadTraderStatistics
} from '../../store/interactions'

class InvestorTraders extends Component {
  constructor(props) {
    super(props);
    this.state = {filter: 'filterRadiosLevel', filterTradingAsset: 'ETH', filterProfitAsset: 'ETH'};
  }
  render() {
    const { investableTraders, network, dispatch } = this.props

    if (investableTraders.length === 0) {
      return (
        <Alert variant="info">
          Looks you are a VERY early investor ;) <br/>
          Hang in there, we're in the process of getting the best traders on board! <br/><br/>
          Please check in regularly for updates.
        </Alert>
      )
    } else {

      for(let i=0; i<investableTraders.length; i++) {
        if (!investableTraders[i].statistics) {
          loadTraderStatistics(investableTraders[i].user, network, dispatch)
          return null
        }
      }

      investableTraders.sort((a,b) => {

        switch(this.state.filter) {
          case 'filterRadiosLevel': {
            console.log('sort', this.state.filter)
            return a.statistics.level - b.statistics.level
            break
          }
          case 'filterRadiosTrust': {
            console.log('sort', this.state.filter)
            return a.statistics.trustRating - b.statistics.trustRating
            break
          }
          case 'filterRadiosTrading': {
            console.log('sort', this.state.filter, this.state.filterTradingAsset)
            return a.statistics.tradingRatings.ratings[this.state.filterTradingAsset] - 
              b.statistics.tradingRatings.ratings[this.state.filterTradingAsset]
            break
          }
          case 'filterRadiosProfit': {
            console.log('sort', this.state.filter, this.state.filterTradingAsset)
            return a.statistics.profitRatings.ratings[this.state.filterProfitAsset] - 
              b.statistics.profitRatings.ratings[this.state.filterProfitAsset]
            break
          }
        }
      })
    }

    return (

      <Container>
        <Form.Group>
        <Row>
          <Col sm={2}>
            <Form.Check onChange={(e) => {changeFilter(e, this)}}
              inline
              defaultChecked
              type="radio"
              label="level"
              name="filterRadios"
              id="filterRadiosLevel"
            />
          </Col>
          <Col sm={2}>
            <Form.Check onChange={(e) => {changeFilter(e, this)}}
              inline
              type="radio"
              label="trust rating"
              name="filterRadios"
              id="filterRadiosTrust"
            />
          </Col>
          <Col sm={4}>
            <Form.Check onChange={(e) => {changeFilter(e, this)}}
              inline
              type="radio"
              label="trading performance"
              name="filterRadios"
              id="filterRadiosTrading"
            />
            <Form.Control as="select" defaultValue="ETH" id="filterSelectTradingAsset" onChange={(e) => {changeFilterTradingAsset(e, this)}}>
              <option>ETH</option>
              <option>DAI</option>
              <option>USDC</option>
            </Form.Control>
          </Col>
          <Col sm={4}>
            <Form.Check onChange={(e) => {changeFilter(e, this)}}
              inline
              type="radio"
              label="profit performance"
              name="filterRadios"
              id="filterRadiosProfit"
            />
            <Form.Control as="select" defaultValue="ETH" id="filterSelectProfitAsset" onChange={(e) => {changeFilterProfitAsset(e, this)}}>
              <option>ETH</option>
              <option>DAI</option>
              <option>USDC</option>
            </Form.Control>
          </Col>
        </Row>
        </Form.Group>
        <Row>
          <Col sm={12}>
            { 
              investableTraders.map((trader) => {
                return (
                    <InvestorTraderDetail trader={trader} key={trader.user}/>
                )
              })
            }
          </Col>
        </Row>
      </Container>
    )
  }
}

function changeFilter (event, component) {
  console.log(event.target.id)
  component.setState({filter: event.target.id})
}

function changeFilterTradingAsset (event, component) {
  component.setState({filterTradingAsset: event.target.value})
}

function changeFilterProfitAsset (event, component) {
  component.setState({filterProfitAsset: event.target.value})
}

function mapStateToProps(state) {

  return {
    network: networkSelector(state),
    traderPaired: traderPairedSelector(state),
    investableTraders: investableTradersSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorTraders)


