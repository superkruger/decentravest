import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import AddressLink from './AddressLink'
import PageLink from './containers/PageLink'
import { Page } from './containers/pages'
import { info } from '../helpers'
import {
  accountSelector,
  mainTraderSelector,
  traderPairedLoadedSelector
} from '../store/selectors'
import { 
  sidebarToggled,
  notificationAdded
} from '../store/actions'

class Topbar extends Component {

  render() {
    const { account, traderPairedLoaded, mainTrader } = this.props

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
            
            { 
              !traderPairedLoaded
              ? 
                <div>
                {
                  (typeof window.ethereum !== 'undefined') ?
                    <ConnectButton props={this.props} /> :
                  <span>
                    Please install <a href="https://metamask.io" target="_blank" rel="noopener">Metamask</a> first.
                  </span>
                }
                </div>
               :
                <div>
                {
                  account
                  ? <AddressLink address={account}/>
                  : <span></span>
                }
                </div>
            }
          </li>

        </ul>

      </nav>
    )
  }
}

function ConnectButton(props) {
  const { dispatch } = props.props

  const handleClick = () => {
    dispatch(notificationAdded(info("metamask", "Connecting...")))
    window.ethereum.request({ method: 'eth_requestAccounts' })
  }

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Connect Metamask
      </Button>
    </div>
  );
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
    mainTrader: mainTraderSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state)
  }
}

export default connect(mapStateToProps)(Topbar)


