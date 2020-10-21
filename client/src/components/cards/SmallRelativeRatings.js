import React, { Component } from 'react'
import { connect } from 'react-redux'

class SmallRelativeRatings extends Component {

  render() {
    const {title, ratings, icon, border} = this.props

    return (
      <div>
        <div className={`card border-left-${border} shadow h-100 py-2`}>
          <div className="card-body">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">{title}</div>
                {
                  ratings.map((rating) => {
                    return (
                      <div key={rating.name} className="row no-gutters align-items-center">
                        <div className="col-sm-4">
                          <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">{rating.name}</div>
                        </div>
                        <div className="col-sm-8">
                          <div className="progress progress-sm mr-2">
                            <div className="progress-bar bg-info" role="progressbar" style={{width: `${rating.value * 10}%`}} aria-valuenow={rating.value} aria-valuemin="0" aria-valuemax="10"></div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                }
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
    ratings: ownProps.ratings,
    icon: ownProps.icon,
    border: ownProps.border
  }
}

export default connect(mapStateToProps)(SmallRelativeRatings)


