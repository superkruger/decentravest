import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from '../Spinner'
import {
  accountSelector, 
  traderPairedSelector,
  investorSelector
} from '../../store/selectors'
import { 
  pageSelected
} from '../../store/actions'

class InvestorSidebarMenu extends Component {

  render() {
    return (
      <div>

        <DashboardButton props={this.props} /> 
            
        <TradersButton props={this.props} />

        <InvestmentsButton props={this.props} />

      </div>
    )
  }
}

function DashboardButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor_dashboard'));

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-tachometer-alt"></i>
        <span>Investor Dashboard</span></a>
    </li>
  );
}

function TradersButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor_traders'));

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-users"></i>
        <span>Traders</span></a>
    </li>
  );
}

function InvestmentsButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor_investments'));

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-coins"></i>
        <span>Investments</span></a>
    </li>
  );
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    investor: investorSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorSidebarMenu)


