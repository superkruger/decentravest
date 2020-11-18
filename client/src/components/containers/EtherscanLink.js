import React, { Component } from 'react'
import { connect } from 'react-redux'

import {
  networkSelector
} from '../../store/selectors'

class EtherscanLink extends Component {

  render() {
    const { network, type, address, target } = this.props



    return (
      <a title={`${address}`} href={`https://` + process.env['REACT_APP_'+network+'_ETHERSCAN_BASE'] + `.etherscan.io/${type}/${address}`} target="_blank" rel="noopener">
        {address}
      </a>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    network: networkSelector(state),
    address: ownProps.address,
    target: ownProps.target ? ownProps.target : "_blank"
  }
}

export default connect(mapStateToProps)(EtherscanLink)
