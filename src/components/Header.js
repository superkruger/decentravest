import React, { Component } from 'react'
import { connect } from 'react-redux'

class Header extends Component {

  render() {
    return (
      <div>
        <div className="header">
        	<div className="logo">
            	<img src={`${process.env.PUBLIC_URL}/android-chrome-192x192.png`} alt=""/>
            	<h3>Decentravest</h3>
          	</div>
			<div className="header-right">
			</div>
		</div>
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
  }
}

export default connect(mapStateToProps)(Header)


