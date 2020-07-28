import { createStore, applyMiddleware, compose } from 'redux'
import { createLogger } from 'redux-logger'
import rootReducer from './reducers'

const loggerMiddleware = process.env.NODE_ENV === 'development' ? createLogger() : null
// const loggerMiddleware = createLogger()
const middleware = []

// for reduc devtools
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

export default function configureStore ( preloadedState ) {
	return createStore (
		rootReducer,
		preloadedState,
		composeEnhancers (loggerMiddleware ? applyMiddleware (...middleware, loggerMiddleware) : applyMiddleware (...middleware))
	)
}