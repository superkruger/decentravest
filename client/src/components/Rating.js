import React, { Component } from 'react'
import { connect } from 'react-redux'
import { OverlayTrigger, Tooltip } from 'react-bootstrap'

class Rating extends Component {

  render() {
    return (
      <RatingStars props={this.props} />
    )
  }
}

function RatingStars(props) {
  const {ratingKey, rating} = props.props
  return (
    <OverlayTrigger
      placement="right"
      key={`rating-${ratingKey}`}
      overlay={
        <Tooltip id={`rating-${ratingKey}`}>
          {`${rating}`}
        </Tooltip>
      }
    >
      <span key={`rating-${ratingKey}`}>
        <Stars props={props.props}/>
      </span>
    </OverlayTrigger>
  )
}

function Stars(props) {
  const {ratingKey, rating} = props.props
  let numStars = Number.parseInt(rating)

  let stars = [];
  for (var i = 0; i < 10; i++) {
    if (i <= numStars) {
      stars.push(<span className="fas fa-star" key={`rating-${ratingKey}-${i}`}></span>)
    } else {
      stars.push(<span className="far fa-star" key={`rating-${ratingKey}-${i}`}></span>)
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


