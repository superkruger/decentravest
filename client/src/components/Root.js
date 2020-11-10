import React from 'react'
import PropTypes from 'prop-types'
import { Provider } from 'react-redux'
import { HashRouter as Router, Route } from 'react-router-dom'
import { createHashHistory } from 'history'
import App from './App'

const history = createHashHistory()

const Root = ({ store }) => (
  <Provider store={store}>
    <Router history={history}>
      <Route path="/:page?/:section?" component={App} />
    </Router>
  </Provider>
)

Root.propTypes = {
  store: PropTypes.object.isRequired
}

export default Root