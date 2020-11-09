import React, { Component } from 'react'
import { connect } from 'react-redux'

class WalletInstruction extends Component {

  render() {
    const {title, message, image} = this.props

    return (
      <div>
        <div className="card border-left-info shadow h-100 py-2">
          <div className="card-body">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">{title}</div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">{message}</div>
              </div>
              <div className="col-auto">
                <img src="/img/walletinstruction.gif" alt=""></img>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}

function mapStateToProps(state, ownProps) {
  return {
    title: ownProps.title,
    message: ownProps.message,
    image: ownProps.image
  }
}

export default connect(mapStateToProps)(WalletInstruction)
