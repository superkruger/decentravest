import React, { Component } from 'react'
import { connect } from 'react-redux'
import AddressLink from './AddressLink'
import PageLink from './containers/PageLink'
import { Page } from './containers/pages'
import {
  accountSelector,
  mainTraderSelector
} from '../store/selectors'
import { 
  sidebarToggled
} from '../store/actions'

class Topbar extends Component {

  render() {
    const { account, mainTrader } = this.props

    return (
      <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">

        {/* Sidebar Toggle (Topbar) */}
        <SidebarToggleTop props={this.props} />

        {/* Topbar Navbar */}
        <ul className="navbar-nav ml-auto">

          <div className="topbar-divider d-none d-sm-block"></div>

          {/* Nav Item - User Information */}
          { mainTrader 
            ?
              <li className="nav-item">
                <PageLink page={Page.TRADER_PROFILE} section={mainTrader.user} styles="nav-link">
                    <i className="fas fa-address-card"></i>
                </PageLink>
              </li>
            :
              <div/>
          }
          <li className="nav-item">
            { account
                ? <AddressLink address={account}/>
                : <span></span>
              }
          </li>

        </ul>

      </nav>
    )
  }
}

function SidebarToggleTop(props) {
  const handleClick = () => props.props.dispatch(sidebarToggled())

  return (
    <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3" onClick={handleClick}>
      <i className="fa fa-bars"></i>
    </button>
  )
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    mainTrader: mainTraderSelector(state)
  }
}

export default connect(mapStateToProps)(Topbar)


