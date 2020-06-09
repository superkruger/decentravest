import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import { 
  loadTraderPositions
} from '../store/dydxInteractions'
import { 
  accountSelector, 
  crowdvestSelector,
  traderSelector,
  traderPositionsSelector,
  traderPositionsLoadedSelector
} from '../store/selectors'

class Trader extends Component {
  componentDidMount() {
    const { account, dispatch } = this.props
    loadTraderPositions(account, dispatch)
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
                  <th>Status</th>
                  <th>Market</th>
                  <th>Profit</th>
                </tr>
              </thead>
              { this.props.traderPositionsLoaded ? showPositions(this.props.traderPositions) : <Spinner type="table" /> }
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
              <td>{position.status}</td>
              <td>{position.market}</td>
              <td>{position.profit.formattedAmount}</td>
            </tr>
        )
      })
    }
    </tbody>
  )
}


function mapStateToProps(state) {
  const account = accountSelector(state)
  const crowdvest = crowdvestSelector(state)

  return {
    account: account,
    crowdvest: crowdvest,
    trader: traderSelector(state),
    traderPositionsLoaded: traderPositionsLoadedSelector(state),
    traderPositions: traderPositionsSelector(state)
  }
}

export default connect(mapStateToProps)(Trader)
