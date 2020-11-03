import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Badge } from 'react-bootstrap'
import PageLink from '../containers/PageLink'
import { Page } from '../containers/pages'
import {
  accountSelector, 
  traderPairedSelector,
  investorSelector,
  walletSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'

class InvestorSidebarMenu extends Component {

  render() {
    const {wallet} = this.props

    return (
      <div className="col-sm-12">

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
  return (
    <li className="nav-item active">
      <PageLink page={Page.INVESTOR_DASHBOARD} styles="nav-link">
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-tachometer-alt"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Investor Dashboard</div>
          </div>
        </div>
      </PageLink>
    </li>
  )
}

function TradersButton(props) {
  return (
    <li className="nav-item active">
      <PageLink page={Page.INVESTOR_TRADERS} styles="nav-link">
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-users"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Traders</div>
          </div>
        </div>
      </PageLink>
    </li>
  )
}

function InvestmentsButton(props) {
  const { investmentActionRequired } = props.props
  
  return (
    <li className="nav-item active">
      <PageLink page={Page.INVESTOR_INVESTMENTS} styles="nav-link">
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
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    investor: investorSelector(state),
    wallet: walletSelector(state),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorSidebarMenu)


