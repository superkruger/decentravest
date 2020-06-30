import React, { Component } from 'react'
import { connect } from 'react-redux'
import { 
  accountSelector, 
  traderPairedSelector,
  investorSelector
} from '../store/selectors'

class Investor extends Component {

  render() {
    return (
      <div>
        Not yet open for investors
      </div>
    )
  }
}


function mapStateToProps(state) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    account: account,
    traderPaired: traderPaired,
    investor: investorSelector(state)
  }
}

export default connect(mapStateToProps)(Investor)
