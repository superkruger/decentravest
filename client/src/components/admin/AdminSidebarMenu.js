import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import PageLink from '../containers/PageLink'
import { Page } from '../containers/pages'
import {
  accountSelector, 
  traderPairedSelector
} from '../../store/selectors'

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
  return (
    <li className="nav-item active">
      <PageLink page={Page.ADMIN_DASHBOARD} styles="nav-link">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Admin Dashboard</span>
      </PageLink>
    </li>
  )
}

function TradersButton(props) {
  return (
    <li className="nav-item active">
      <PageLink page={Page.ADMIN_TRADERS} styles="nav-link">
          <i className="fas fa-fw fa-chart-pie"></i>
          <span>Traders</span>
      </PageLink>
    </li>
  )
}

function InvestorsButton(props) {
  return (
    <li className="nav-item active">
      <PageLink page={Page.ADMIN_INVESTORS} styles="nav-link">
          <i className="fas fa-fw fa-coins"></i>
          <span>Investors</span>
      </PageLink>
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


