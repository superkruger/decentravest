import React, { Component } from 'react'
import { connect } from 'react-redux'
import Topbar from './Topbar'
import Footer from './Footer'
import Intro from './Intro'
import Join from './Join'
import Trader from './Trader'
import Investor from './Investor'

import {
  accountSelector, 
  traderPairedSelector,
  traderPairedLoadedSelector,
  traderSelector,
  investorSelector,
  traderJoiningSelector,
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
                  'join': <Join />,
                  'trader': <Trader />,
                  'investor': <Investor />
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
  const trader = traderSelector(state)
  const investor = investorSelector(state)
  return {
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderPairedLoaded: traderPairedLoadedSelector(state),
    joined: trader || investor,
    trader: trader,
    investor: investor,
    traderJoining: traderJoiningSelector(state),
    page: pageSelector(state)
  }
}

export default connect(mapStateToProps)(Content)


