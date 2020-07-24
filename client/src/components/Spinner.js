import React from 'react'

export default function ({ type }) {
  if (type === 'table') {
    return(<tbody className="spinner-grow text-dark text-center"></tbody>)
  } else {
    return(
    	<div className="d-flex justify-content-center">
		  <div className="spinner-grow text-dark text-center" role="status">
		    <span className="sr-only">Loading...</span>
		  </div>
		</div>
    )
  }
}