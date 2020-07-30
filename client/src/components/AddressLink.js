import React from 'react'
import Identicon from 'identicon.js'

export default function ({ address }) {
    return(
    	<a className="nav-link" title={`${address}`} href={`https://${process.env.REACT_APP_ETHERSCAN_BASE}.etherscan.io/address/${address}`} target="_blank" rel="noopener">
        <img
          className="ml-2"
          width='25'
          height='25'
          src={`data:image/png;base64,${new Identicon(address, 25).toString()}`}
          alt={`${address}`}
        />
      </a>
    )
  
}