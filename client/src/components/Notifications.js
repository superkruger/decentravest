import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Toast, Alert } from 'react-bootstrap'
import {
  notificationRemoved
} from '../store/actions'
import {
  notificationsSelector
} from '../store/selectors'

class Notifications extends Component {

  render() {
    const { notifications } = this.props


    console.log(notifications)

    return (
      <div
        aria-live="polite"
        aria-atomic="true"
        className="toast_container"
      >
        { 
          notifications.map((notification) => {
            return (
              <Notification notification={notification} props={this.props} key={notification.id}/>
            )
          })
        }
      </div>
    )
  }
}

function Notification(props) {
  const { notification } = props
  const { dispatch } = props.props
  const [show, setShow] = React.useState(true);

  const removeNotification = (id) => {
    setShow(false)
    dispatch(notificationRemoved(id))
  }

  return (
    <Toast onClose={() => removeNotification(notification.id)} show={show} delay={5000} autohide>
      <Toast.Header>
        <img
          src="holder.js/20x20?text=%20"
          className="rounded mr-2"
          alt=""
        />
        <strong className="mr-auto">{notification.title}&nbsp;</strong>
        <small></small>
      </Toast.Header>
      <Toast.Body>
        <Alert variant={notification.variant}>
          {notification.message}<br/>
          {
            notification.hash
            && <a href={`https://etherscan.io/tx/${notification.hash}`} target="_blank" rel="noopener">Check transaction</a>
          }
        </Alert>
      </Toast.Body>
    </Toast>
  )
}

function mapStateToProps(state) {

  return {
    notifications: notificationsSelector(state)
  }
}

export default connect(mapStateToProps)(Notifications)
