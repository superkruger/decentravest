import React from 'react'
import { NavLink } from 'react-router-dom'
import { Page } from './pages'

const PageLink = ({ page, styles, children }) => (
    <NavLink
      exact
      to={page === Page.ROOT ? '/' : `/${page}`}
      className={styles}
      activeStyle={{
        textDecoration: 'none',
        color: 'black'
      }}
    >
      {children}
    </NavLink>
)

export default PageLink