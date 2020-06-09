import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import { 
  accountSelector, 
  crowdvestSelector,
  investorSelector
} from '../store/selectors'

class Investor extends Component {

  render() {
    return (
      <div>
        Investor
      </div>
    )
  }
}


function mapStateToProps(state) {
  const account = accountSelector(state)
  const crowdvest = crowdvestSelector(state)

  return {
    account: account,
    crowdvest: crowdvest,
    investor: investorSelector(state)
  }
}

export default connect(mapStateToProps)(Investor)
