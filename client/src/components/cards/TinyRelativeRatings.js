import React, { Component } from 'react'
import { connect } from 'react-redux'

class TinyRelativeRatings extends Component {

  render() {
    const {title, ratings, border} = this.props

    return (
      <div>
        <div className={`card border-left-${border} shadow h-100 py-2`}>
          <div className="pl-1">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">{title}</div>
                {
                  ratings.map((rating) => {
                    return (
                      <div key={rating.name} className="row no-gutters align-items-center">
                        <div className="col-sm-4">
                          <div className="text-xs mb-0 mr-0 font-weight-bold text-gray-800">{rating.name}</div>
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
    border: ownProps.border
  }
}

export default connect(mapStateToProps)(TinyRelativeRatings)
