import React, { Component } from 'react'
import { connect } from 'react-redux'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

class TinyStars extends Component {

  render() {
    const {title, value, border} = this.props

    return (
      <div>
        <div className={`card border-left-${border} shadow h-100 py-2`}>
          <div className="pl-1">
            <div className="row no-gutters align-items-center">
              <div className="col mr-2">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">{title}</div>
                <div className="row no-gutters align-items-center">
                  <div className="col-auto">
                    {
                      value
                      ? <StarsContainer props={this.props} />
                      : <span>Not enough data yet.</span>
                    }
                  </div>
                </div>
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
      stars.push(<span className="text-xs fas fa-star" key={`stars-${title}-${i}`}></span>)
    } else {
      stars.push(<span className="text-xs far fa-star" key={`stars-${title}-${i}`}></span>)
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
    border: ownProps.border
  }
}

export default connect(mapStateToProps)(TinyStars)


