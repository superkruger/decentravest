import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import {
  accountSelector, 
  traderPairedSelector
} from '../../store/selectors'
import { 
  pageSelected
} from '../../store/actions'

class AdminSidebarMenu extends Component {

  render() {
    return (
      <div>
        <DashboardButton props={this.props} /> 
            
        <TradersButton props={this.props} />

        <InvestorsButton props={this.props} />
      </div>
    )
  }
}

function DashboardButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('admin_dashboard'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="/#" onClick={handleClick}>
        <i className="fas fa-fw fa-tachometer-alt"></i>
        <span>Admin Dashboard</span>
      </a>
    </li>
  )
}

function TradersButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('admin_traders'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="/#" onClick={handleClick}>
        <i className="fas fa-fw fa-chart-pie"></i>
        <span>Traders</span>
      </a>
    </li>
  )
}

function InvestorsButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('admin_investors'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="/#" onClick={handleClick}>
        <i className="fas fa-fw fa-coins"></i>
        <span>
          Investors
        </span>
      </a>
    </li>
  )
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state)
  }
}

export default connect(mapStateToProps)(AdminSidebarMenu)


