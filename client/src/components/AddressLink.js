import React, { Component } from 'react'
import { connect } from 'react-redux'
import Identicon from 'identicon.js'

import {
  networkSelector
} from '../store/selectors'

class AddressLink extends Component {

  render() {
    const { network, address } = this.props

    return (
      <a className="nav-link" title={`${address}`} href={`https://` + process.env['REACT_APP_'+network+'_ETHERSCAN_BASE'] + `.etherscan.io/address/${address}`} target="_blank" rel="noopener">
        <img
          className="ml-2"
          width='25'
          height='25'
          src={`data:image/png;base64,${new Identicon(address, 25).toString()}`}
          alt={`${address}`}
        />
      </a>
    )
  }
}

function mapStateToProps(state) {
  return {
    network: networkSelector(state)
  }
}

export default connect(mapStateToProps)(AddressLink)
