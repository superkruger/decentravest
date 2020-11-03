import React, { Component } from 'react'
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import { Button, Container, Row, Col, Alert, Form, Nav } from 'react-bootstrap'
import Spinner from './Spinner'
import {
  web3Selector,
  networkSelector,
  accountSelector, 
  traderPairedSelector,
  pairedInvestmentsSelector,
  walletFactorySelector,
  investorJoiningSelector
} from '../store/selectors'
import { 
  joinAsTrader, 
  joinAsInvestor 
} from '../store/interactions'

class JoinInvestor extends Component {

  constructor(props) {
    super(props);

    this.state = {termsAccepted: false}
  }

  render() {
    const { ready } = this.props
    return (
      <div>
      {
        ready ?
            <InvestorJourney props={this.props} component={this} />
          : <Spinner type="div" />
      }
      </div>
    )
  }
}

function InvestorJourney(props) {
  const {component} = props

  return (
    <Container>
      <Row>
        <Col sm={12}>
          <div id="timeline" className="details">
            <div className="container">
              <div className="section-title">
                <h2>Investor Journey</h2>
                <p>Once you've registered as an investor, this is what your journey will look like</p>
              </div>
              <hr/>
              <div className="row content">
                <div className="col-md-12 order-1 order-md-1" data-aos="fade-up">
                  <div className="tl">
                      <div className="tl-container tl-left" data-aos="fade-right">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <i className={`fas fa-wallet fa-2x text-gray-300`}></i>
                            </div>
                            <div className="col-auto">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Create Wallet</div>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                You'll create your own personal multisig wallet, for which only you and the traders you invest in have access. 
                                All <em>collateral</em> investments are kept safely in this wallet. 
                                <em>Direct</em> investments however are transfered directly to the trader
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tl-container tl-right" data-aos="fade-left">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Find Traders</div>
                            </div>
                            <div className="col-auto">
                              <i className={`fas fa-search-dollar fa-2x text-gray-300`}></i>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                You can use the <em>Traders</em> page to search for the best performing traders based on their level, trust, trading and profit ratings.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tl-container tl-left" data-aos="fade-right">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <i className={`fas fa-handshake fa-2x text-gray-300`}></i>
                            </div>
                            <div className="col-auto">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Invest</div>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                Once you've found suitable traders, invest in them with either a collateral or direct investment. It's strongly advised to spread your investments across as many traders as you can.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="tl-container tl-right" data-aos="fade-left">
                        <div className="tl-content">
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="h5 mb-0 font-weight-bold text-uppercase text-gray-300">Disbursement</div>
                            </div>
                            <div className="col-auto">
                              <i className={`fas fa-hand-holding-usd fa-2x text-gray-300`}></i>
                            </div>
                          </div>
                          <div className="row no-gutters">
                            <div className="col mr-2">
                              <div className="mb-0 text-gray-100">
                                You can keep investments going for as long or short as you like. It's strongly advised to disburse them perdiodically and re-invest with another or the same trader. This helps to keep the traders honest and improves the rating system.
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>
      <hr/>
      <br/>
      <Row>
        <Col sm={4}>
          <Terms props={props.props} component={component} />
        </Col>
        <Col sm={8}>
          <InvestorButton props={props.props} component={component} />
        </Col>
      </Row>
    </Container>
  )
}

function Terms(props) {
  const {component} = props

  const handleChange = (event) => component.setState({termsAccepted: event.target.checked})

  const label = ( <div>I accept the <a href="https://www.decentravest.com/terms.html" target="_blank" rel="noopener">terms & conditions</a></div> )

  return (
    <Form>
      <Form.Check 
        inline
        type="checkbox"
        id="accept_terms"
        label={label}
        onChange={(e) => {handleChange(e)}}
      />
    </Form>
  )
}

function InvestorButton(props) {
  const { component } = props
  const { investorJoining } = props.props
  const handleClick = () => investorJoin(props.props)

  return (
    <div className="row-center">
    {
      investorJoining ?
      <Spinner />
      :
      <div>
      {
        component.state.termsAccepted
        ? <Button
            className="row-center"
            variant="success"
            size="lg"
            onClick={handleClick}
            >
            Join as Investor (Just one click!)
          </Button>
        : <Button
            className="row-center"
            variant="success"
            size="lg"
            disabled
            >
            Join as Investor (Just one click!)
          </Button>
      }
      </div>
    }
    </div>
  )
}

const investorJoin = async (props) => {
  const { network, account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history } = props

  await joinAsInvestor(network, account, traderPaired, pairedInvestments, walletFactory, web3, dispatch, history)

}

function mapStateToProps(state) {
  const account = accountSelector(state)
  const traderPaired = traderPairedSelector(state)

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
    account: account,
    traderPaired: traderPaired,
    pairedInvestments: pairedInvestmentsSelector(state),
    walletFactory: walletFactorySelector(state),
    ready: account && traderPaired,
    investorJoining: investorJoiningSelector(state)
  }
}

export default connect(mapStateToProps)(withRouter(JoinInvestor))
