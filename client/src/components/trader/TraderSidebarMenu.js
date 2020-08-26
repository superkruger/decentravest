import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import {
  accountSelector, 
  traderPairedSelector,
  traderSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'
import { 
  pageSelected
} from '../../store/actions'

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
  const handleClick = () => props.props.dispatch(pageSelected('trader_dashboard'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="/#" onClick={handleClick}>
        <i className="fas fa-fw fa-tachometer-alt"></i>
        <span>Trader Dashboard</span>
      </a>
    </li>
  )
}

function AllocationsButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('trader_allocations'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="/#" onClick={handleClick}>
        <i className="fas fa-fw fa-chart-pie"></i>
        <span>Allocations</span>
      </a>
    </li>
  )
}

function InvestmentsButton(props) {
  const { investmentActionRequired } = props.props
  const handleClick = () => props.props.dispatch(pageSelected('trader_investments'))

  return (
    <li className="nav-item active">
      <a className="nav-link" href="/#" onClick={handleClick}>
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
  const account = accountSelector(state)
  return {
    account: account,
    traderPaired: traderPairedSelector(state),
    trader: traderSelector(state, account),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(TraderSidebarMenu)


