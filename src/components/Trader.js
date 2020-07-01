import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import { 
  loadTraderPositions,
  loadTraderRating
} from '../store/dydxInteractions'
import { 
  accountSelector, 
  traderPairedSelector,
  allTradersSelector,
  traderPositionsSelector
} from '../store/selectors'
import { ZERO_ADDRESS } from '../helpers'

class Trader extends Component {
  async componentDidMount() {
    const { account, allTraders, dispatch } = this.props
    if (account !== null && account != ZERO_ADDRESS) {

      // FIXME: use real account
      loadTraderPositions('0x6b98d58200439399218157B4A3246DA971039460', dispatch)

      if (allTraders.length > 0) {
        let _allTraders = [/*'0x62382ffab4b9ad8c9806e72b270ac46ff0be7561','0xf039e5291859d1a0b1095a2840631e8ebc00ce14', '0xae7f08301a0b774b3f9a7f7f3b7e99f1570eb1dc', */'0x4c47e4f5866aeb4514700e3d710a6b00c68c553f']
        let _account = '0x4c47e4f5866aeb4514700e3d710a6b00c68c553f'
        await loadTraderRating(_account, _allTraders, dispatch)
      }
    }
  }

  render() {
    return (
      <div className="card bg-light text-dark">
        <div className="card-header">
          Trade positions
        </div>
        <div className="card-body">
          <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Market</th>
                  <th>Asset</th>
                  <th>Profit</th>
                  <th>Fee</th>
                  <th>Nett Profit</th>
                </tr>
              </thead>
              { showPositions(this.props.traderPositions) }
            </table>
        </div>
      </div>
    )
  }
}

function showPositions(positions) {
  return (
    <tbody>
    { positions.map((position) => {
        console.log(position)
        return (
            <tr key={position.uuid}>
              <td className="text-muted">{position.formattedCreatedAt}</td>
              <td>{position.type}</td>
              <td>{position.market}</td>
              <td>{position.asset}</td>
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
    traderPositions: traderPositionsSelector(state)
  }
}

export default connect(mapStateToProps)(Trader)
