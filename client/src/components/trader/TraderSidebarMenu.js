import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import PageLink from '../containers/PageLink'
import { Page } from '../containers/pages'
import {
  accountSelector, 
  traderPairedSelector,
  traderSelector,
  investmentActionRequiredSelector,
  hasValidAllocationSelector
} from '../../store/selectors'

class TraderSidebarMenu extends Component {

  render() {
    return (
      <div className="col-sm-12">
        <DashboardButton props={this.props} /> 

        <ProfitPercentagesButton props={this.props} /> 
            
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
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-tachometer-alt"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Trader Dashboard</div>
          </div>
        </div>
      </PageLink>
    </li>
  )
}

function ProfitPercentagesButton(props) {
  return (
    <li className="nav-item active">
      <PageLink page={Page.TRADER_PROFITPERCENTAGES} styles="nav-link">
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-percent"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Profit Percentages</div>
          </div>
        </div>
      </PageLink>
    </li>
  )
}

function AllocationsButton(props) {
  const { hasValidAllocation } = props.props

  return (
    <li className="nav-item active">
      <PageLink page={Page.TRADER_ALLOCATIONS} styles="nav-link">
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-chart-pie"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Allocations</div>
          </div>
          {
            !hasValidAllocation && 
              <div className="col ml-2">
                <Badge variant="warning">!</Badge>
              </div>
          }
        </div>
      </PageLink>
    </li>
  )
}

function InvestmentsButton(props) {
  const { investmentActionRequired } = props.props

  return (
    <li className="nav-item active">
      <PageLink page={Page.TRADER_INVESTMENTS} styles="nav-link">
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-coins"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Investments</div>
          </div>
          {
            investmentActionRequired && 
              <div className="col ml-2">
                <Badge variant="warning">!</Badge>
              </div>
          }
        </div>
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
    investmentActionRequired: investmentActionRequiredSelector(state),
    hasValidAllocation: hasValidAllocationSelector(state, account)
  }
}

export default connect(mapStateToProps)(TraderSidebarMenu)


