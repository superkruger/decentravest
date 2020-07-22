import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import TraderSidebarMenu from './trader/TraderSidebarMenu'
import InvestorSidebarMenu from './investor/InvestorSidebarMenu'
import {
  traderSelector,
  investorSelector,
  sidebarClosedSelector
} from '../store/selectors'
import { 
  pageSelected,
  sidebarToggled
} from '../store/actions'

class Sidebar extends Component {

  render() {
    const { sidebarClosed } = this.props

    return (
      <ul className={`navbar-nav bg-gradient-primary sidebar sidebar-dark accordion ${sidebarClosed ? "toggled" : ""}`} id="accordionSidebar">

        {/* Sidebar - Brand */}
        <Logo props={this.props} />
        

        {/* Divider */}
        <hr className="sidebar-divider my-0"/>

        {/* Nav Item - Dashboard */}

        { 
          this.props.joined ? 
            <div>
              {
                this.props.trader ?
                <TraderSidebarMenu /> :
                <InvestorSidebarMenu />
              }
            
            </div>
          :

          <div>
          </div>
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
  const handleClick = () => props.props.dispatch(pageSelected('home'));

  return (
    <a className="logo sidebar-brand d-flex align-items-center justify-content-center" href="#home" onClick={handleClick}>
      <div className="sidebar-brand-icon">
        <img src={`${process.env.PUBLIC_URL}/logo-192.png`} alt=""/>
      </div>
      <div className="sidebar-brand-text mx-3">Decentravest</div>
    </a>
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

function mapStateToProps(state) {
  const trader = traderSelector(state)
  const investor = investorSelector(state)
  return {
    joined: trader || investor,
    trader: trader,
    investor: investor,
    sidebarClosed: sidebarClosedSelector(state)
  }
}

export default connect(mapStateToProps)(Sidebar)


