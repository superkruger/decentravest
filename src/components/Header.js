import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector,
  traderSelector,
  investorSelector,
  traderJoiningSelector
} from '../store/selectors'
import { 
  pageSelected
} from '../store/actions'

class Header extends Component {

  render() {
    return (
      <div>
        <div className="header">
        	<div className="logo">
            <Logo props={this.props} />
          	
        	
      			<div className="header-right">
              { !this.props.traderPairedLoaded ? 
                  <a href="#">Connect Metamask</a> : 
                  
                    this.props.joined ?
                    
                      this.props.trader ?
                      <TraderButton props={this.props} /> :
                      <InvestorButton props={this.props} />
                     :

                    <JoinButton props={this.props} />
                }
      			</div>
          </div>
		    </div>
      </div>
    )
  }
}

function Logo(props) {
  const handleClick = () => props.props.dispatch(pageSelected('home'));

  return (
    <a href="#home" className="logo" onClick={handleClick}>
      <img src={`${process.env.PUBLIC_URL}/android-chrome-192x192.png`} alt=""/>
      <h3>Decentravest</h3>
    </a>
  );
}

function JoinButton(props) {
  const { traderJoining } = props.props
  const handleClick = () => props.props.dispatch(pageSelected('join'));

  return (
    <div>
    {
      traderJoining ?
        <Spinner />
        :
        <Button
          variant="primary"
          onClick={handleClick}
        >
          Join Now!
        </Button>
    }
    </div>
  );
}

function TraderButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('trader'));

  return (
    <div>
      <Button
        variant="primary"
        onClick={handleClick}
      >
        Trader Dashboard
      </Button>
    </div>
  );
}

function InvestorButton(props) {
  const handleClick = () => props.props.dispatch(pageSelected('investor'));

  return (
    <Button
      variant="primary"
      onClick={handleClick}
    >
      Investor Dashboard
    </Button>
  );
}

function mapStateToProps(state) {
  const trader = traderSelector(state)
  const investor = investorSelector(state)
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor,
    traderJoining: traderJoiningSelector(state)
  }
}

export default connect(mapStateToProps)(Header)


