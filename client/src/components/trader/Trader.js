import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Alert, Form, Button, Container, Row, Col, Tabs, Tab } from 'react-bootstrap'
import Rating from '../Rating'
import Spinner from '../Spinner'
import { 
  loadTraderPositions
} from '../../store/dydxInteractions'
import { 
  networkSelector,
  accountSelector, 
  traderSelector,
  traderPairedSelector,
  tradersSelector,
  traderPositionsSelector,
  traderRatingsSelector
} from '../../store/selectors'
import { 
  setProfitPercentages,
  loadTraderRatings
} from '../../store/interactions'
import { ZERO_ADDRESS } from '../../helpers'

class Trader extends Component {
  componentDidMount() {
    const { network, account, dispatch } = this.props
    
    loadTraderPositions(network, account, dispatch)
    loadTraderRatings(account, network, dispatch)
  }

  render() {
    const {traderRatings} = this.props

    if (!traderRatings) {
      return (
        <Spinner />
      )
    }

    return (

      <div>
        <DashboardTabs props={this.props}/>
      </div>

    )
  }
}

function DashboardTabs(props) {
  const [key, setKey] = React.useState('profitPercentages')
  const {trader, traderPositions, traderRatings, page, section} = props.props

  const tradingRatingKeys = Object.keys(traderRatings.tradingRatings)
  const profitRatingKeys = Object.keys(traderRatings.profitRatings)

  console.log("ratings", traderRatings.trustRating.trustRating)

  return (
    <Tabs id="trader_dashboard"
        activeKey={section || key}
        onSelect={(k) => {setKey(k); props.props.history.push(`/${page}/${k}`)}}>
        
        <Tab eventKey="profitPercentages" title="Profit Percentages">
          <div className="card shadow mb-4">
            <div className="card-body">
              <Container>
                <Row>
                  <Col sm={6}>
                    <Alert variant="info">
                      Set your investor profit percentages here. The higher the values, the more your investors will earn.
                    </Alert>
                  </Col>
                  <Col sm={6}>
                    <div>
                      <Form>
                        <Form.Group controlId="collateralProfit">
                          <Form.Label>Collateral Investment Profit</Form.Label>
                          <Form.Control type="number" placeholder="Investor profit for collateral investments" defaultValue={trader.investorCollateralProfitPercent} />
                        </Form.Group>
                        <Form.Group controlId="directProfit">
                          <Form.Label>Direct Investment Profit</Form.Label>
                          <Form.Control type="number" placeholder="Investor profit for direct investments" defaultValue={trader.investorDirectProfitPercent} />
                        </Form.Group>
                        <Button variant="primary" onClick={(e) => {profitSubmitHandler("collateralProfit", "directProfit", this.props)}}>
                          Set Profit Percentages
                        </Button>
                      </Form>
                    </div>
                  </Col>
                </Row>
              </Container>
            </div>
          </div>
        </Tab>
        <Tab eventKey="ratings" title="Ratings">
          <div className="card shadow mb-4">
            <div className="card-body">
              <div className="card shadow mb-4" key='ratings_trading'>
                <a href='#ratings_trading' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_trading'>
                  <h6>Trading Ratings</h6>
                </a>
                <div className="collapse" id="ratings_trading">
                  <div className="card-body">
                    <Container>
                      <Row>
                        <Col sm={6}>
                          <Alert variant="info">
                            Your trading rating is based on trade profits relative to other traders on this platform.
                          </Alert>
                        </Col>
                        <Col sm={6}>
                        {
                          tradingRatingKeys.map((key) => {
                            return (
                              <Row>
                                <Col sm={3}>
                                  <h5>{key}</h5>
                                </Col>
                                <Col sm={9}>
                                  <h5><Rating ratingKey={`trading_${key}`} rating={traderRatings.tradingRatings[key]}/></h5>
                                </Col>
                              </Row>
                            )
                          })
                        }
                        </Col>
                      </Row>
                    </Container>
                  </div>
                </div>
              </div>
              <div className="card shadow mb-4" key='ratings_profit'>
                <a href='#ratings_profit' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_profit'>
                  <h6>Profit Rating</h6>
                </a>
                <div className="collapse" id="ratings_profit">
                  <div className="card-body">
                    <Container>
                      <Row>
                        <Col sm={6}>
                          <Alert variant="info">
                            Your profit rating is based on returns to your investors relative to the returns of other traders
                          </Alert>
                        </Col>
                        <Col sm={6}>
                        {
                          profitRatingKeys.map((key) => {
                            return (
                              <Row>
                                <Col sm={3}>
                                  <h5>{key}</h5>
                                </Col>
                                <Col sm={9}>
                                  <h5><Rating ratingKey={`profit_${key}`} rating={traderRatings.profitRatings[key]}/></h5>
                                </Col>
                              </Row>
                            )
                          })
                        }
                        </Col>
                      </Row>
                    </Container>
                  </div>
                </div>
              </div>
              <div className="card shadow mb-4" key='ratings_trust'>
                <a href='#ratings_trust' className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls='ratings_trust'>
                  <h6>Trust Rating</h6>
                </a>
                <div className="collapse" id="ratings_trust">
                  <div className="card-body">
                    <Container>
                      <Row>
                        <Col sm={6}>
                          <Alert variant="info">
                            Your trust rating is based on how settlements are handled. Any suspect or fraudulent activity will impact it negatively, as well as waiting more than 48 hours to approve a settlement request
                          </Alert>
                        </Col>
                        <Col sm={6}>
                          <Row>
                            <Col sm={3}>
                              <h5>Trust</h5>
                            </Col>
                            <Col sm={9}>
                            {
                              traderRatings.trustRating.trustRating
                              ? <h5><Rating ratingKey="trust" rating={traderRatings.trustRating.trustRating}/></h5>
                              : <span>Not enough data yet. Needs at least one settlement</span>
                            }
                            </Col>
                          </Row>
                        </Col>
                      </Row>
                    </Container>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Tab>
        <Tab eventKey="tradeHistory" title="Trade History">
          <div className="card shadow mb-4">
            <div className="card-body">
              <Container>
                <Row>
                  <Col sm={12}>
                    <Alert variant="info">
                      Below are your completed trades on dydx.
                    </Alert>
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    <div className="card shadow mb-4">
                      <a href="#WETH_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="WETH_Trades">
                        <h6 className="m-0 font-weight-bold text-primary">ETH Trades</h6>
                      </a>
                      <div className="collapse" id="WETH_Trades">
                        <div className="card-body">
                          <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Profit</th>
                              </tr>
                            </thead>
                            { showPositions(traderPositions["WETH"]) }
                          </table>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    <div className="card shadow mb-4">
                      <a href="#DAI_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="DAI_Trades">
                        <h6 className="m-0 font-weight-bold text-primary">DAI Trades</h6>
                      </a>
                      <div className="collapse" id="DAI_Trades">
                        <div className="card-body">
                          <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Profit</th>
                              </tr>
                            </thead>
                            { showPositions(traderPositions["DAI"]) }
                          </table>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    <div className="card shadow mb-4">
                      <a href="#USDC_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="USDC_Trades">
                        <h6 className="m-0 font-weight-bold text-primary">USDC Trades</h6>
                      </a>
                      <div className="collapse" id="USDC_Trades">
                        <div className="card-body">
                          <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Type</th>
                                <th>Profit</th>
                              </tr>
                            </thead>
                            { showPositions(traderPositions["USDC"]) }
                          </table>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Container>
            </div>
          </div>
        </Tab>
      </Tabs>
  );
}


function profitSubmitHandler (collateralInputId, directInputId, props) {
  const {account, traderPaired, dispatch} = props

  const collateralPercentage = document.getElementById(collateralInputId).value
  const directPercentage = document.getElementById(directInputId).value

  setProfitPercentages(account, collateralPercentage, directPercentage, traderPaired, dispatch)
}

function showPositions(positions) {
  if (positions === undefined || positions.length === 0) {
    return (
      <tbody></tbody>
    )
  }

  return (
    <tbody>
    { positions.map((position) => {
        return (
            <tr key={position.uuid}>
              <td className="text-muted">{position.formattedStart}</td>
              <td>{position.type}</td>
              <td className={`text-${position.profit.profitClass}`}>{position.profit.formattedProfit}</td>
            </tr>
        )
      })
    }
    </tbody>
  )
}


function mapStateToProps(state, ownProps) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    page: ownProps.page,
    section: ownProps.section,
    network: networkSelector(state),
    account: account,
    traderPaired: traderPaired,
    trader: traderSelector(state, account),
    traders: tradersSelector(state),
    traderPositions: traderPositionsSelector(state),
    traderRatings: traderRatingsSelector(state, account)
  }
}

export default connect(mapStateToProps)(withRouter(Trader))
