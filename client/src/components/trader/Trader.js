import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Alert, Form, Button, Container, Row, Col } from 'react-bootstrap'
import Rating from '../Rating'
import { 
  loadTraderPositions,
  loadTraderRatings
} from '../../store/dydxInteractions'
import { 
  accountSelector, 
  traderSelector,
  traderPairedSelector,
  tradersSelector,
  traderPositionsSelector,
  traderRatingsSelector
} from '../../store/selectors'
import { 
  setProfitPercentages,
  loadTraderTrustRating
} from '../../store/interactions'
import { ZERO_ADDRESS } from '../../helpers'

class Trader extends Component {
  componentDidMount() {
    const { account, trader, traderPaired, traders, dispatch } = this.props
    if (account !== null && account !== ZERO_ADDRESS) {

      loadTraderPositions(account, dispatch)

      loadTraderRatings(account, traders, dispatch)

      loadTraderTrustRating(trader, traderPaired, dispatch)
    }
  }

  render() {
    const {trader, traderPositions, traderRatings} = this.props

    return (

      <div>
        <div className="card shadow mb-4">
          <a href="#trustRating" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="trustRating">
            <h6 className="m-0 font-weight-bold text-primary">Trust Rating</h6>
          </a>
          <div className="collapse" id="trustRating">
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
                      <Col sm={4}>
                        Trust Rating:
                      </Col>
                      <Col sm={8}>
                      {
                        trader.trustRating
                        ? <Rating ratingKey="trust" rating={trader.trustRating}/>
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

        
        <div className="card shadow mb-4">
          <a href="#profitPercentages" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="profitPercentages">
            <h6 className="m-0 font-weight-bold text-primary">Investor Profit Percentages</h6>
          </a>
          <div className="collapse" id="profitPercentages">
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
        </div>

        <div className="card shadow mb-4">
          <a href="#tradeHistory" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="tradeHistory">
            <h6 className="m-0 font-weight-bold text-primary">Trade history and ratings</h6>
          </a>
          <div className="collapse" id="tradeHistory">
            <div className="card-body">
              <Container>
                <Row>
                  <Col sm={12}>
                    <Alert variant="info">
                      Below are your completed trades on dydx and a rating relative to other traders on this platform.
                    </Alert>
                  </Col>
                </Row>
                <Row>
                  <Col sm={12}>
                    <div className="card shadow mb-4">
                      <a href="#WETH_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="WETH_Trades">
                        <h6 className="m-0 font-weight-bold text-primary">ETH Trades <Rating ratingKey="WETH" rating={`${traderRatings["WETH"]}`}/></h6>
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
                        <h6 className="m-0 font-weight-bold text-primary">DAI Trades <Rating ratingKey="DAI" rating={`${traderRatings["DAI"]}`}/></h6>
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
                        <h6 className="m-0 font-weight-bold text-primary">USDC Trades <Rating ratingKey="USDC" rating={`${traderRatings["USDC"]}`}/></h6>
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
        </div>

        

      </div>

    )
  }
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


function mapStateToProps(state) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    account: account,
    traderPaired: traderPaired,
    trader: traderSelector(state, account),
    traders: tradersSelector(state),
    traderPositions: traderPositionsSelector(state),
    traderRatings: traderRatingsSelector(state, account)
  }
}

export default connect(mapStateToProps)(Trader)
