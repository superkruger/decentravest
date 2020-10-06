import React, { Component } from 'react'
import { connect } from 'react-redux'
import Topbar from './Topbar'
import Footer from './Footer'
import Intro from './Intro'
import JoinTrader from './JoinTrader'
import JoinInvestor from './JoinInvestor'
import Trader from './trader/Trader'
import Investor from './investor/Investor'

import TraderAllocations from './trader/TraderAllocations'
import TraderInvestments from './trader/TraderInvestments'

import InvestorTraders from './investor/InvestorTraders'
import InvestorInvestments from './investor/InvestorInvestments'

import { Page } from './containers/pages'

import {
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector
} from '../store/selectors'

class Content extends Component {

  render() {
    const { page, section } = this.props

    return (
      <div id="content-wrapper" className="d-flex flex-column">

        {/* Main Content */}
        <div id="content">

          {/* Topbar */}
          <Topbar />
          {/* End of Topbar */}

          {/* Begin Page Content */}
          <div className="container-fluid">

            <div className="d-sm-flex align-items-center justify-content-between mb-4">
              {
                {
                  'join_trader': <JoinTrader />,
                  'join_investor': <JoinInvestor />,
                  'trader_dashboard': <Trader page={page} section={section} />,
                  'trader_allocations': <TraderAllocations />,
                  'trader_investments': <TraderInvestments />,
                  'investor_dashboard': <Investor page={page} section={section} />,
                  'investor_traders': <InvestorTraders />,
                  'investor_investments': <InvestorInvestments />,
                  undefined: <Intro />
                }[this.props.page]
              }
          
            </div>


          </div>
          {/* /.container-fluid */}

        </div>
        {/* End of Main Content */}

        {/* Footer */}
        <Footer />
        {/* End of Footer */}

      </div>
    )
  }
}



function mapStateToProps(state, ownProps) {
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    page: ownProps.page,
    section: ownProps.section
  }
}

export default connect(mapStateToProps)(Content)


