import React, { Component } from 'react'
import { connect } from 'react-redux'

class TinyNumber extends Component {

  render() {
    const {title, amount, border} = this.props

    return (
      <div>
        <div className={`card border-left-${border} shadow h-40 py-2`}>
          <div className="pl-1">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">{title}</div>
                <div className="text-xs mb-0 font-weight-bold text-gray-800">{amount}</div>
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
    amount: ownProps.amount,
    border: ownProps.border
  }
}

export default connect(mapStateToProps)(TinyNumber)
