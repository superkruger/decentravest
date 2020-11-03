import React, { Component } from 'react'
import { connect } from 'react-redux'

class SmallNumber extends Component {

  render() {
    const {title, amount, icon, border} = this.props

    return (
      <div>
        <div className={`card border-left-${border} shadow h-100 py-2`}>
          <div className="card-body">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">{title}</div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">{amount}</div>
              </div>
              <div className="col-auto">
                <i className={`fas ${icon} fa-2x text-gray-300`}></i>
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
    icon: ownProps.icon,
    border: ownProps.border
  }
}

export default connect(mapStateToProps)(SmallNumber)
