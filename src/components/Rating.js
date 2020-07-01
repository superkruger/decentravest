import React, { Component } from 'react'
import { connect } from 'react-redux'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

import 'font-awesome/css/font-awesome.min.css';

class Rating extends Component {

  render() {
    return (
      <RatingStars props={this.props} />
    )
  }
}

function RatingStars(props) {
  const {asset, rating} = props.props
  return (
    <OverlayTrigger
      placement="right"
      key={`rating-${asset}`}
      overlay={
        <Tooltip id={`rating-${asset}`}>
          {`${rating}`}
        </Tooltip>
      }
    >
      <span>
        <Stars props={props.props}/>
      </span>
    </OverlayTrigger>
  )
}

function Stars(props) {
  const {rating} = props.props
  let numStars = Number.parseInt(rating)

  let stars = [];
  for (var i = 0; i < 10; i++) {
    if (i <= numStars) {
      stars.push(<span class="fas fa-star"></span>)
    } else {
      stars.push(<span class="far fa-star"></span>)
    }
  }

  return (
    stars
  )
}

function mapStateToProps(state) {
  return {
  }
}

export default connect(mapStateToProps)(Rating)


