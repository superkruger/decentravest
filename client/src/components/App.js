import React, { Component } from 'react'
import { connect } from 'react-redux'

import Sidebar from './Sidebar'
import Content from './Content'
import Notifications from './Notifications'
import { log } from '../helpers'
import './App.css'
import { 
  loadWebApp,
} from '../store/interactions'
import {
  pageSelector,
  web3Selector,
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector,
  sidebarClosedSelector
} from '../store/selectors'

class App extends Component {
  componentDidMount() {
    this.loadBlockchainData(this.props.dispatch)
  }

  async loadBlockchainData(dispatch) {
    await loadWebApp(dispatch)
  }

  render() {
    const { sidebarClosed } = this.props

    return (
      <div id="page-top" className={ sidebarClosed ? 'sidebar-toggled' : ''}>
        <Notifications />
        <div id="wrapper">
          <Sidebar />
          <Content />
        </div>
        <a className="scroll-to-top rounded" href="#page-top">
          <i className="fas fa-angle-up"></i>
        </a>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    page: pageSelector(state),
    web3: web3Selector(state),
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    sidebarClosed: sidebarClosedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
