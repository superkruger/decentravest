import React, { Component } from 'react'
import { connect } from 'react-redux'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

class SmallStars extends Component {

  render() {
    const {title, value, icon, border} = this.props

    return (
      <div>
        <div className={`card border-left-${border} shadow h-100 py-2`}>
          <div className="card-body">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">{title}</div>
                <div className="row no-gutters align-items-center">
                  <div className="col-auto">
                    <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">{value}</div>
                  </div>
                  <div className="col">
                    <StarsContainer props={this.props} />
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

function StarsContainer(props) {
  const {title, value} = props.props
  return (
    <OverlayTrigger
      placement="right"
      key={`stars-${title}`}
      overlay={
        <Tooltip id={`stars-${title}`}>
          {`${value}`}
        </Tooltip>
      }
    >
      <span key={`stars-${title}`}>
        <Stars props={props.props}/>
      </span>
    </OverlayTrigger>
  )
}

function Stars(props) {
  const {title, value} = props.props
  let numStars = Number.parseInt(value)

  let stars = [];
  for (var i = 0; i < 10; i++) {
    if (i < numStars) {
      stars.push(<span className="fas fa-star" key={`stars-${title}-${i}`}></span>)
    } else {
      stars.push(<span className="far fa-star" key={`stars-${title}-${i}`}></span>)
    }
  }

  return (
    stars
  )
}

function mapStateToProps(state, ownProps) {
  return {
    title: ownProps.title,
    value: ownProps.value,
    icon: ownProps.icon,
    border: ownProps.border
  }
}

export default connect(mapStateToProps)(SmallStars)
