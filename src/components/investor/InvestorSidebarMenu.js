import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import Spinner from '../Spinner'
import {
  accountSelector, 
  traderPairedSelector,
  investorSelector,
  walletSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'
import { 
  pageSelected
} from '../../store/actions'

class InvestorSidebarMenu extends Component {

  render() {
    const {wallet} = this.props

    return (
      <div>

        <DashboardButton props={this.props} /> 

        {
          wallet ?   
            <div>
              <TradersButton props={this.props} />
              <InvestmentsButton props={this.props} />
            </div> :
          <div/>
        }

      </div>
    )
  }
}

function DashboardButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor_dashboard'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-tachometer-alt"></i>
        <span>Investor Dashboard</span></a>
    </li>
  )
}

function TradersButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor_traders'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-users"></i>
        <span>Traders</span></a>
    </li>
  )
}

function InvestmentsButton(props) {
  const { investmentActionRequired } = props.props
  const handleClick = () => props.props.dispatch(pageSelected('investor_investments'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-coins"></i>
        <span>
          Investments
          {
            investmentActionRequired && 
              <Badge variant="danger">!</Badge>
          }
        </span>
      </a>
    </li>
  )
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    investor: investorSelector(state),
    wallet: walletSelector(state),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorSidebarMenu)


