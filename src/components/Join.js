import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Button } from 'react-bootstrap'
import Spinner from './Spinner'
import { 
  accountSelector, 
  crowdvestSelector 
} from '../store/selectors'
import { 
  joinAsTrader, 
  joinAsInvestor 
} from '../store/interactions'

class Join extends Component {

  render() {
    return (
      <div className="content">
      {
        this.props.ready ?
        <div className="vertical-split">
          <TraderButton props={this.props} />
          <InvestorButton props={this.props} />
        </div>
        : <Spinner type="div" />
      }
      </div>
    )
  }
}

function TraderButton(props) {
  const handleClick = () => traderJoin(props.props);

  return (
    <Button
      variant="primary"
      onClick={handleClick}
    >
      Join as Trader
    </Button>
  );
}

function InvestorButton(props) {
  const handleClick = () => investorJoin(props.props);

  return (
    <Button
      variant="primary"
      onClick={handleClick}
    >
      Join as Investor
    </Button>
  );
}

const traderJoin = async (props) => {
  const { account, crowdvest, dispatch } = props

  try {
    await joinAsTrader(account, crowdvest, dispatch)
  } catch(e) {
    console.log(e)
    return;
  }
}

const investorJoin = async (props) => {
  const { account, crowdvest, dispatch } = props

  try {
    await joinAsInvestor(account, crowdvest, dispatch)
  } catch(e) {
    console.log(e)
    return;
  }
}

function mapStateToProps(state) {
  const account = accountSelector(state)
  const crowdvest = crowdvestSelector(state)

  return {
    account: account,
    crowdvest: crowdvest,
    ready: account && crowdvest
  }
}

export default connect(mapStateToProps)(Join)
