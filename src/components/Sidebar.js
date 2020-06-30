import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import {
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector,
  traderSelector,
  investorSelector,
  traderJoiningSelector
} from '../store/selectors'
import { 
  pageSelected
} from '../store/actions'

class Sidebar extends Component {

  render() {
    return (
      <ul className="navbar-nav bg-gradient-primary sidebar sidebar-dark accordion" id="accordionSidebar">

        {/* Sidebar - Brand */}
        <Logo props={this.props} />
        

        {/* Divider */}
        <hr className="sidebar-divider my-0"/>

        {/* Nav Item - Dashboard */}

        { !this.props.traderPairedLoaded ? 
          <li className="nav-item active">
            <div className="nav-link">
              <i className="fas fa-fw fa-tachometer-alt"></i>
              <span>Please Connect Metamask</span>
            </div>
          </li> : 
          
            this.props.joined ?
            
              this.props.trader ?
              <TraderButton props={this.props} /> :
              <InvestorButton props={this.props} />
             :

            <JoinButton props={this.props} />
        }

        {/* Divider */}
        <hr className="sidebar-divider d-none d-md-block"/>

        {/* Sidebar Toggler (Sidebar) */}
        {/*
        <div className="text-center d-none d-md-inline">
          <button className="rounded-circle border-0" id="sidebarToggle"></button>
        </div>
        */}
      </ul>
    )
  }
}

function Logo(props) {
  const handleClick = () => props.props.dispatch(pageSelected('home'));

  return (
    <a className="logo sidebar-brand d-flex align-items-center justify-content-center" href="#home" onClick={handleClick}>
      <div className="sidebar-brand-icon">
        <img src={`${process.env.PUBLIC_URL}/android-chrome-192x192.png`} alt=""/>
      </div>
      <div className="sidebar-brand-text mx-3">Decentravest</div>
    </a>
  );
}
function JoinButton(props) {
  const { traderJoining } = props.props
  const handleClick = () => props.props.dispatch(pageSelected('join'));

  return (
    <div>
    {
      traderJoining ?
        <Spinner />
        :
        <li className="nav-item active">
          <a className="nav-link" href="#" onClick={handleClick}>
            <i className="fas fa-fw fa-tachometer-alt"></i>
            <span>Join Now!</span></a>
        </li>
    }
    </div>
  );
}

function TraderButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('trader'));

  return (
    <div>
      <li className="nav-item active">
        <a className="nav-link" href="#" onClick={handleClick}>
          <i className="fas fa-fw fa-tachometer-alt"></i>
          <span>Trader Dashboard</span></a>
      </li>
    </div>
  );
}

function InvestorButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor'));

  return (
    <li className="nav-item active">
      <a className="nav-link" href="#" onClick={handleClick}>
        <i className="fas fa-fw fa-tachometer-alt"></i>
        <span>Investor Dashboard</span></a>
    </li>
  );
}
function mapStateToProps(state) {
  const trader = traderSelector(state)
  const investor = investorSelector(state)
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor,
    traderJoining: traderJoiningSelector(state)
  }
}

export default connect(mapStateToProps)(Sidebar)


