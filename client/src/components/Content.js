import React, { Component } from 'react'
import { connect } from 'react-redux'
import Spinner from './Spinner'
import Topbar from './Topbar'
import Footer from './Footer'
import Intro from './Intro'
import Notifications from './Notifications'
import JoinTrader from './JoinTrader'
import JoinInvestor from './JoinInvestor'

import PublicStatistics from './PublicStatistics'

import DocsTradersTrading from './docs/DocsTradersTrading'
import DocsTradersSettings from './docs/DocsTradersSettings'
import DocsTradersInvestments from './docs/DocsTradersInvestments'
import DocsInvestorsTraders from './docs/DocsInvestorsTraders'
import DocsInvestorsInvestments from './docs/DocsInvestorsInvestments'

import Trader from './trader/Trader'
import Profile from './trader/Profile'
import Investor from './investor/Investor'

import ProfitPercentages from './trader/ProfitPercentages'
import TraderAllocations from './trader/TraderAllocations'
import TraderInvestments from './trader/TraderInvestments'

import InvestorTraders from './investor/InvestorTraders'
import InvestorInvestments from './investor/InvestorInvestments'

import { Page } from './containers/pages'

import { 
  networkSelector,
  accountSelector, 
  traderPairedSelector
} from '../store/selectors'

class Content extends Component {

  render() {
    const { page, section, network, account, traderPaired } = this.props

    // if (requiresWeb3(page)) {
    //   if (!network || !account || !traderPaired) {
    //     return (
    //       <Spinner />
    //     )
    //   }
    // }

    return (
      <div id="content-wrapper" className="d-flex flex-column">

        {/* Main Content */}
        <div id="content">

          {/* Topbar */}
          <Topbar />
          {/* End of Topbar */}
          
          <Notifications />

          {/* Begin Page Content */}
          <div className="container-fluid">
          {
            requiresWeb3(page) && (!network || !account || !traderPaired)
            ? <Intro />
            : <div className="d-sm-flex align-items-center justify-content-between mb-4">
                {
                  {
                    'public_statistics': <PublicStatistics />,
                    'docs_traders_trading': <DocsTradersTrading />,
                    'docs_traders_settings': <DocsTradersSettings />,
                    'docs_traders_investments': <DocsTradersInvestments />,
                    'docs_investors_traders': <DocsInvestorsTraders />,
                    'docs_investors_investments': <DocsInvestorsInvestments />,
                    'join_trader': <JoinTrader />,
                    'join_investor': <JoinInvestor />,
                    'trader_profile': <Profile page={page} section={section} />,
                    'trader_dashboard': <Trader page={page} section={section} />,
                    'trader_profitpercentages': <ProfitPercentages page={page} />,
                    'trader_allocations': <TraderAllocations />,
                    'trader_investments': <TraderInvestments />,
                    'investor_dashboard': <Investor page={page} section={section} />,
                    'investor_traders': <InvestorTraders page={page} section={section} />,
                    'investor_investments': <InvestorInvestments />,
                    undefined: <Intro />
                  }[this.props.page]
                }
            
              </div>
          }

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

function requiresWeb3(page) {
  return page !== 'trader_profile' && 
         page !== 'public_statistics' &&
         page !== 'docs_traders_trading' &&
         page !== 'docs_traders_settings' &&
         page !== 'docs_traders_investments' &&
         page !== 'docs_investors_traders' &&
         page !== 'docs_investors_investments'
}

function mapStateToProps(state, ownProps) {
  return {
    page: ownProps.page,
    section: ownProps.section,
    network: networkSelector(state),
    account: accountSelector(state), 
    traderPaired: traderPairedSelector(state)
  }
}

export default connect(mapStateToProps)(Content)


