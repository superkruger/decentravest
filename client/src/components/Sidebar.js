import React, { Component } from 'react'
import { connect } from 'react-redux'
import TraderSidebarMenu from './trader/TraderSidebarMenu'
import InvestorSidebarMenu from './investor/InvestorSidebarMenu'
import AdminSidebarMenu from './admin/AdminSidebarMenu'
import PageLink from './containers/PageLink'
import { Page } from './containers/pages'
import {
  accountSelector,
  traderSelector,
  investorSelector,
  sidebarClosedSelector,
  isAdminSelector
} from '../store/selectors'
import { 
  sidebarToggled
} from '../store/actions'

class Sidebar extends Component {

  render() {
    const { isAdmin, joined, trader, sidebarClosed } = this.props

    return (
      <ul className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${sidebarClosed ? "toggled" : ""}`} id="accordionSidebar">

        {/* Sidebar - Brand */}
        <Logo props={this.props} />
        

        {/* Divider */}
        <hr className="sidebar-divider my-0"/>

        {/* Nav Item - Dashboard */}

        { 
          isAdmin ?
            <AdminSidebarMenu />
          : joined ? 
              <div>
                {
                  trader ?
                    <TraderSidebarMenu />
                  : <InvestorSidebarMenu />
                }
              
              </div>
            : <div />
          
        }

          <hr className="sidebar-divider my-0"/>

          <StatisticsButton props={this.props} /> 

          <DocsButton props={this.props} /> 

        {/* Divider */}
        <hr className="sidebar-divider d-none d-md-block"/>

        {/* Sidebar Toggler (Sidebar) */}
        
        <SidebarToggle props={this.props} />
        
      </ul>
    )
  }
}

function Logo(props) {
  return (
    <PageLink page={Page.ROOT} styles="logo sidebar-brand d-flex align-items-center justify-content-center">
      <div className="sidebar-brand-icon">
        <img src={`${process.env.PUBLIC_URL}/logo-192.png`} alt=""/>
      </div>
      <div className="sidebar-brand-text mx-3">Decentravest</div>
    </PageLink>
  )

}

function StatisticsButton(props) {
  return (
    <li className="nav-item">
      <PageLink page={Page.PUBLIC_STATISTICS} styles="nav-link">
        <div className="row no-gutters align-items-left">
          <div className="col-auto">
            <i className="fas fa-fw fa-chart-bar"></i>
          </div>
          <div className="col-auto">
            <div className="font-weight-bold mb-1">Statistics</div>
          </div>
        </div>
      </PageLink>
    </li>
  )
}

function DocsButton(props) {
  return (
    <li className="nav-item">
      <a className="nav-link collapsed" data-toggle="collapse" data-target="#collapseDocumentation" aria-expanded="true" aria-controls="collapseDocumentation">
        <i className="fas fa-fw fa-book"></i>
        <span>Documentation</span>
      </a>
      <div id="collapseDocumentation" className="collapse" aria-labelledby="headingDocumentation" data-parent="#accordionSidebar">
        <div className="bg-light py-2 collapse-inner rounded">
          <h6 className="collapse-header">Traders:</h6>
          <PageLink page={Page.DOCUMENTATION_TRADERS_TRADING} styles="collapse-item">Trading</PageLink>
          <PageLink page={Page.DOCUMENTATION_TRADERS_SETTINGS} styles="collapse-item">Settings</PageLink>
          <PageLink page={Page.DOCUMENTATION_TRADERS_INVESTMENTS} styles="collapse-item">Investments</PageLink>
          <h6 className="collapse-header">Investors:</h6>
          <PageLink page={Page.DOCUMENTATION_INVESTORS_TRADERS} styles="collapse-item">Traders</PageLink>
          <PageLink page={Page.DOCUMENTATION_INVESTORS_INVESTMENTS} styles="collapse-item">Investments</PageLink>
        </div>
      </div>
    </li>
  )
}

function SidebarToggle(props) {
  const handleClick = () => props.props.dispatch(sidebarToggled())

  return (
    <div className="text-center d-none d-md-inline">
      <button className="rounded-circle border-0" id="sidebarToggle" onClick={handleClick}></button>
    </div>
  )
}

function mapStateToProps(state, ownProps) {
  const account = accountSelector(state)
  const trader = traderSelector(state, account)
  const investor = investorSelector(state)
  return {
    page: ownProps.page,
    account: account,
    isAdmin: isAdminSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor,
    sidebarClosed: sidebarClosedSelector(state)
  }
}

export default connect(mapStateToProps)(Sidebar)


