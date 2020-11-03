import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import Sidebar from './Sidebar'
import Content from './Content'
import { log } from '../helpers'
import './App.css'
import { 
  loadWebApp,
} from '../store/interactions'
import {
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
    const { sidebarClosed, page, section } = this.props

    return (
      <div id="page-top" className={ sidebarClosed ? 'sidebar-toggled' : ''}>
        <div id="wrapper">
          <Sidebar page={page}/>
          <Content page={page} section={section} />
        </div>
        <a className="scroll-to-top rounded" href="#page-top">
          <i className="fas fa-angle-up"></i>
        </a>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    page: ownProps.match.params.page,
    section: ownProps.match.params.section,
    sidebarClosed: sidebarClosedSelector(state)
  }
}

export default connect(mapStateToProps)(App);
