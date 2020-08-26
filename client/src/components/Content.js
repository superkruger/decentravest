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

import {
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector,
  pageSelector
} from '../store/selectors'

class Content extends Component {

  render() {
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
                  'home': <Intro />,
                  'jointrader': <JoinTrader />,
                  'joininvestor': <JoinInvestor />,
                  'trader_dashboard': <Trader />,
                  'trader_allocations': <TraderAllocations />,
                  'trader_investments': <TraderInvestments />,
                  'investor_dashboard': <Investor />,
                  'investor_traders': <InvestorTraders />,
                  'investor_investments': <InvestorInvestments />
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



function mapStateToProps(state) {
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    page: pageSelector(state)
  }
}

export default connect(mapStateToProps)(Content)


