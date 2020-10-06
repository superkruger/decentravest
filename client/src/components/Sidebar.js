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


