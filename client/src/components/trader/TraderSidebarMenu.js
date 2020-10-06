import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import PageLink from '../containers/PageLink'
import { Page } from '../containers/pages'
import {
  accountSelector, 
  traderPairedSelector,
  traderSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'

class TraderSidebarMenu extends Component {

  render() {
    return (
      <div>
        <DashboardButton props={this.props} /> 
            
        <AllocationsButton props={this.props} />

        <InvestmentsButton props={this.props} />
      </div>
    )
  }
}

function DashboardButton(props) {
  return (
    <li className="nav-item active">
      <PageLink page={Page.TRADER_DASHBOARD} styles="nav-link">
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Trader Dashboard</span>
      </PageLink>
    </li>
  )
}

function AllocationsButton(props) {
  return (
    <li className="nav-item active">
      <PageLink page={Page.TRADER_ALLOCATIONS} styles="nav-link">
          <i className="fas fa-fw fa-chart-pie"></i>
          <span>Allocations</span>
      </PageLink>
    </li>
  )
}

function InvestmentsButton(props) {
  const { investmentActionRequired } = props.props

  return (
    <li className="nav-item active">
      <PageLink page={Page.TRADER_INVESTMENTS} styles="nav-link">
          <i className="fas fa-fw fa-coins"></i>
          <span>
            Investments
            {
              investmentActionRequired && 
                <Badge variant="danger">!</Badge>
            }
          </span>
      </PageLink>
    </li>
  )
}

function mapStateToProps(state) {
  const account = accountSelector(state)
  return {
    account: account,
    traderPaired: traderPairedSelector(state),
    trader: traderSelector(state, account),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(TraderSidebarMenu)


