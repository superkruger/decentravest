import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import Identicon from 'identicon.js'
import { etherToWei } from '../helpers'
import { 
  investEther
} from '../store/interactions'
import { 
  web3Selector,
  accountSelector, 
  traderPairedSelector,
  investorSelector,
  allTradersSelector
} from '../store/selectors'

class Investor extends Component {

  render() {

    return (
      <div>
        { showTraders(this.props) }
      </div>
    )
  }
}

function showTraders(props) {
  const { allTraders } = props

  if (showTraders === undefined || showTraders.length === 0) {
    return (
      <div></div>
    )
  }

  return (
    <div>
    { allTraders.map((trader) => {
        return (
          <span key={trader}>
            <a className="nav-link" title={`${trader}`} href={`https://etherscan.io/address/${trader}`} target="_blank" rel="noopener">
              <img
                className="ml-2"
                width='25'
                height='25'
                src={`data:image/png;base64,${new Identicon(trader, 25).toString()}`}
                alt={`${trader}`}
              />
            </a>
            <InvestButton props={props} trader={trader}/>
          </span>
        )
      })
    }
    </div>
  )
}

function InvestButton(props, trader) {
  const handleClick = () => invest(props.props, trader)

  return (
    <Button
      variant="primary"
      onClick={handleClick}
    >
      Invest
    </Button>
  )
}

const invest = async (props, trader) => {
  const { web3, account, traderPaired, dispatch } = props

  try {
    await investEther(account, trader, etherToWei(1), traderPaired, web3, dispatch)
  } catch(e) {
    console.log(e)
    return;
  }
}

function mapStateToProps(state) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    web3: web3Selector(state),
    account: account,
    traderPaired: traderPaired,
    investor: investorSelector(state),
    allTraders: allTradersSelector(state)
  }
}

export default connect(mapStateToProps)(Investor)
