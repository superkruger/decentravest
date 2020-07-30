import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Alert } from 'react-bootstrap'
import Rating from '../Rating'
import { 
  loadTraderPositions,
  loadTraderRatings
} from '../../store/dydxInteractions'
import { 
  accountSelector, 
  traderPairedSelector,
  tradersSelector,
  traderPositionsSelector,
  traderRatingsSelector
} from '../../store/selectors'
import { ZERO_ADDRESS } from '../../helpers'

class Trader extends Component {
  componentDidMount() {
    const { account, traders, dispatch } = this.props
    if (account !== null && account !== ZERO_ADDRESS) {

      loadTraderPositions(account, dispatch)

      if (traders.length > 0) {
        loadTraderRatings(account, traders, dispatch)
      }
    }
  }

  render() {
    const {traderPositions, traderRatings} = this.props

    return (

      <div>
        <Alert variant="info">
          Below are your completed trades on dydx and a rating relative to other traders on this platform.
        </Alert>
        <div className="card shadow mb-4">
          <a href="#WETH_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="WETH_Trades">
            <h6 className="m-0 font-weight-bold text-primary">ETH Trades <Rating asset="WETH" rating={`${traderRatings["WETH"]}`}/></h6>
          </a>
          <div className="collapse" id="WETH_Trades">
            <div className="card-body">
              <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Profit</th>
                    <th>Fee</th>
                    <th>Nett Profit</th>
                  </tr>
                </thead>
                { showPositions(traderPositions["WETH"]) }
              </table>
            </div>
          </div>
        </div>

        <div className="card shadow mb-4">
          <a href="#DAI_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="DAI_Trades">
            <h6 className="m-0 font-weight-bold text-primary">DAI Trades <Rating asset="DAI" rating={`${traderRatings["DAI"]}`}/></h6>
          </a>
          <div className="collapse" id="DAI_Trades">
            <div className="card-body">
              <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Profit</th>
                    <th>Fee</th>
                    <th>Nett Profit</th>
                  </tr>
                </thead>
                { showPositions(traderPositions["DAI"]) }
              </table>
            </div>
          </div>
        </div>

        <div className="card shadow mb-4">
          <a href="#USDC_Trades" className="d-block card-header py-3 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="USDC_Trades">
            <h6 className="m-0 font-weight-bold text-primary">USDC Trades <Rating asset="USDC" rating={`${traderRatings["USDC"]}`}/></h6>
          </a>
          <div className="collapse" id="USDC_Trades">
            <div className="card-body">
              <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Profit</th>
                    <th>Fee</th>
                    <th>Nett Profit</th>
                  </tr>
                </thead>
                { showPositions(traderPositions["USDC"]) }
              </table>
            </div>
          </div>
        </div>

      </div>

    )
  }
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
              <td>{position.profit.formattedFeeAmount}</td>
              <td className={`text-${position.profit.nettProfitClass}`}>{position.profit.formattedNettProfit}</td>
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
    traders: tradersSelector(state),
    traderPositions: traderPositionsSelector(state),
    traderRatings: traderRatingsSelector(state, account)
  }
}

export default connect(mapStateToProps)(Trader)
