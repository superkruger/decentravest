import React, { Component } from 'react'
import { connect } from 'react-redux'

class SmallProgress extends Component {

  render() {
    const {title, value, icon} = this.props

    return (
      <div>
        <div className="card border-left-info shadow h-100 py-2">
          <div className="card-body">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">{title}</div>
                <div className="row no-gutters align-items-center">
                  <div className="col-auto">
                    <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">50%</div>
                  </div>
                  <div className="col">
                    <div className="progress progress-sm mr-2">
                      <div className="progress-bar bg-info" role="progressbar" style="width: 50%" aria-valuenow={value} aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>
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
    value: ownProps.value,
    icon: ownProps.icon
  }
}

export default connect(mapStateToProps)(SmallProgress)


