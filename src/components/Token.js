import React from 'react'
import Identicon from 'identicon.js'

export default function ({ address }) {
    return(
    	<img
        className="ml-2"
        width='25'
        height='25'
        src={`/img/tokens/${address}.png`}
        alt={`${address}`}
      />
    )
  
}