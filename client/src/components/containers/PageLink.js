import React from 'react'
import { NavLink } from 'react-router-dom'
import { Page } from './pages'

const PageLink = ({ page, section, styles, children }) => (
    <NavLink
      exact
      to={page === Page.ROOT ? '/' : (section ? `/${page}/${section}` : `/${page}`)}
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