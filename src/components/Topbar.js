import React, { Component } from 'react'
import { connect } from 'react-redux'
import Identicon from 'identicon.js'
import {
  accountSelector
} from '../store/selectors'

class Topbar extends Component {

  render() {
    const {
      account
    } = this.props

    return (
      <nav className="navbar navbar-expand navbar-light bg-white topbar mb-4 static-top shadow">

        {/* Sidebar Toggle (Topbar) */}
        <button id="sidebarToggleTop" className="btn btn-link d-md-none rounded-circle mr-3">
          <i className="fa fa-bars"></i>
        </button>

        {/* Topbar Navbar */}
        <ul className="navbar-nav ml-auto">

          <div className="topbar-divider d-none d-sm-block"></div>

          

          {/* Nav Item - User Information */}
          <li className="nav-item dropdown no-arrow">
            { account
                  ? 
            
                    <a className="nav-link" title={`${account}`} href={`https://etherscan.io/address/${account}`} target="_blank" rel="noopener">
                      <img
                        className="ml-2"
                        width='25'
                        height='25'
                        src={`data:image/png;base64,${new Identicon(account, 25).toString()}`}
                        alt={`${account}`}
                      />
                    </a>
                    
                    
                  : <span></span>
                }
           
            
          </li>

        </ul>

      </nav>
    )
  }
}

function mapStateToProps(state) {
  return {
    account: accountSelector(state)
  }
}

export default connect(mapStateToProps)(Topbar)


