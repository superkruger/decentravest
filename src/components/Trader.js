import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import Rating from './Rating'
import { 
  loadTraderPositions,
  loadTraderRatings
} from '../store/dydxInteractions'
import { 
  accountSelector, 
  traderPairedSelector,
  allTradersSelector,
  traderPositionsSelector,
  traderRatingsSelector
} from '../store/selectors'
import { ZERO_ADDRESS } from '../helpers'

class Trader extends Component {
  componentDidMount() {
    const { account, allTraders, dispatch } = this.props
    if (account !== null && account != ZERO_ADDRESS) {

      // FIXME: use real account
      loadTraderPositions(account, dispatch)

      if (allTraders.length > 0) {
        loadTraderRatings(account, allTraders, dispatch)
      }
    }
  }

  render() {
    const {traderPositions, traderRatings} = this.props

    return (

      <div>
        <div className="card shadow mb-4">
          <a href="#WETH_Trades" className="d-block card-header py-3" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="WETH_Trades">
            <h6 className="m-0 font-weight-bold text-primary">WETH Trades <Rating asset="WETH" rating={`${traderRatings["WETH"]}`}/></h6>
          </a>
          <div className="collapse show" id="WETH_Trades">
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
          <a href="#DAI_Trades" className="d-block card-header py-3" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="DAI_Trades">
            <h6 className="m-0 font-weight-bold text-primary">DAI Trades <Rating asset="DAI" rating={`${traderRatings["DAI"]}`}/></h6>
          </a>
          <div className="collapse show" id="DAI_Trades">
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
          <a href="#USDC_Trades" className="d-block card-header py-3" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="USDC_Trades">
            <h6 className="m-0 font-weight-bold text-primary">USDC Trades <Rating asset="USDC" rating={`${traderRatings["USDC"]}`}/></h6>
          </a>
          <div className="collapse show" id="USDC_Trades">
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
        console.log(position)
        return (
            <tr key={position.uuid}>
              <td className="text-muted">{position.formattedCreatedAt}</td>
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
    allTraders: allTradersSelector(state),
    traderPositions: traderPositionsSelector(state),
    traderRatings: traderRatingsSelector(state)
  }
}

export default connect(mapStateToProps)(Trader)
