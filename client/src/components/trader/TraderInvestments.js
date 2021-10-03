import { isEqual, sortBy } from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Badge, Alert, Form } from 'react-bootstrap'
import AddressImage from '../AddressImage'
import EtherscanLink from '../containers/EtherscanLink'
import Token from '../Token'
import Help from '../containers/Help'
import TraderInvestment from './TraderInvestment'
import { 
  log, 
  toBN, 
  uniqueByKey,
  INVESTMENT_COLLATERAL,
  INVESTMENT_STATE_INVESTED,
  INVESTMENT_STATE_STOPPED,
  INVESTMENT_STATE_EXITREQUESTED_INVESTOR,
  INVESTMENT_STATE_EXITREQUESTED_TRADER,
  INVESTMENT_STATE_EXITAPPROVED
 } from '../../helpers'
import { 
  web3Selector,
  networkSelector,
  accountSelector,
  traderSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investmentsSelector,
  tokensSelector,
  investmentActionRequiredSelector
} from '../../store/selectors'
import { 
  stopInvestment,
  disburseInvestment,
  approveDisbursement,
  rejectDisbursement,
  loadTrades
} from '../../store/interactions'

class TraderInvestments extends Component {
  constructor(props) {
    super(props);
    this.state = {pastInvestmentsFilter: false, currentInvestmentsFilter: true};
  }

  componentDidMount() {
    const { network, investments, traderPaired, dispatch } = this.props

    const traderInvestments = uniqueByKey(investments, it => it.trader)

    traderInvestments.forEach(async (investment) => {
      await loadTrades(network, investment.trader, dispatch)
    })
  }

  componentDidUpdate(prevProps) {
    const { network, investments, traderPaired, dispatch } = this.props

    if (!isEqual(network, prevProps.network) || 
        !isEqual(traderPaired, prevProps.traderPaired) || 
        !isEqual(sortBy(investments), sortBy(prevProps.investments))) {
      
      const traderInvestments = uniqueByKey(investments, it => it.trader)

      traderInvestments.forEach(async (investment) => {
        await loadTrades(network, investment.trader, dispatch)
      })
    }
  }

  render() {
    const {investmentActionRequired} = this.props

    return (
      <Container>
        <Row>
          <Col sm={1}>
            <Help helpKey="investments" title="Investments" content="All your investments are listed here. Use the filters to control which of them is visible." />
          </Col>
          <Col sm={11}>
            {
              investmentActionRequired
              ?
                <Alert variant="warning">
                  Some of the investments require your attention
                </Alert>
              :
                <div/>
            }
          </Col>
        </Row>
        <Row>
          <Col sm={12}>  
            <Form>
              <Form.Check 
                inline
                type="switch"
                id="past-investments-filter"
                label="Past Investments"
                onChange={(e) => {switchFilterPastInvestments(e, this)}}
              />
              <Form.Check 
                inline
                defaultChecked
                type="switch"
                id="current-investments-filter"
                label="Current Investments"
                onChange={(e) => {switchFilterCurrentInvestments(e, this)}}
              />
            </Form>
          </Col>
        </Row>
        <Row>
          <Col sm={12}>  
            { showInvestments(this) }
          </Col>
        </Row>
      </Container>
    )
  }
}

function switchFilterPastInvestments (event, component) {
  component.setState({pastInvestmentsFilter: event.target.checked})
}

function switchFilterCurrentInvestments (event, component) {
  component.setState({currentInvestmentsFilter: event.target.checked})
}

function showInvestments(component) {
  const { network, investments } = component.props

  return (
    <div className="col-sm-12">
    { investments.map((investment) => {
        const headerClass = investment.state === INVESTMENT_STATE_EXITAPPROVED ? "disbursed" : ""

        if (investment.state === INVESTMENT_STATE_EXITAPPROVED && !component.state.pastInvestmentsFilter) {
          return null
        }
        
        if (investment.state !== INVESTMENT_STATE_EXITAPPROVED && !component.state.currentInvestmentsFilter) {
          return null
        }

        return (
          <TraderInvestment investment={investment} key={investment.id}/>
        )
        
        // return (
        //   <div className="card shadow mb-4" key={investment.id}>
        //     <a href={`#investments_${investment.id}`} className={`d-block card-header py-3 collapsed ${headerClass}`} data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`investments_${investment.id}`}>
        //       <h6 className="m-0 font-weight-bold text-primary">
        //         <Row>
        //           <Col sm={1}>
        //             {
        //               investment.state === INVESTMENT_STATE_EXITREQUESTED_INVESTOR &&
        //                 <Badge variant="warning">!</Badge>
        //             }
        //             <AddressImage address={investment.investor}/>
        //           </Col>
        //           <Col sm={1}>
        //             <Token address={investment.token} />
        //           </Col>
        //           <Col sm={3}>
        //             <span>Amount: {investment.formattedAmount}</span>
        //           </Col>
        //           <Col sm={3}>
        //             <span className={`text-${investment.profitClass}`}>My Profit: {investment.formattedTraderProfit}</span>
        //           </Col>
        //           <Col sm={3}>
        //             <span className={`text-${investment.profitClass}`}>Investor Profit: {investment.formattedInvestorProfit}</span>
        //           </Col>
        //           <Col sm={1}>
        //             <span className="very-small text-right">
        //               {investment.start.format('D-M-Y')}
        //             </span>
        //           </Col>
        //         </Row>
        //       </h6>
        //     </a>
        //     <div className="collapse" id={`investments_${investment.id}`}>
        //       <div className="card-header">
        //       {
        //         investment.investmentType === INVESTMENT_COLLATERAL
        //         ? <h4>Collateral Investment</h4>
        //         : <h4>Direct Investment</h4>
        //       }
        //       </div>
             
        //         {
        //           investment.changing
        //           ? <div className="card-body">
        //               <Row>
        //                 <Col sm={6}>
        //                   <WalletInstruction title="Confirm Investment" message={investment.message}/>
        //                 </Col>
        //               </Row>
        //             </div>
        //           : <div className="card-body">
        //               <Row>
        //                 <Col sm={8}>
        //                 {
        //                   {
        //                     0: <StopButton investment={investment} props={component.props} />,
        //                     1: <DisburseButton investment={investment} props={component.props} />,
        //                     2: <ApproveButton investment={investment} props={component.props} />,
        //                     3: <ApproveButton investment={investment} props={component.props} />,
        //                     4: <div>Divested</div>
        //                   }[investment.state]
        //                 }
        //                 </Col>
        //                 <Col sm={4}>
        //                   <span className="very-small align-right">
        //                     <table>
        //                       <tbody>
        //                         <tr>
        //                           <td>Start:</td>
        //                           <td>{investment.formattedStart}</td>
        //                         </tr>
        //                         {
        //                           investment.end.unix() > 0 &&
        //                             <tr>
        //                               <td>End:</td>
        //                               <td>{investment.formattedEnd}</td>
        //                             </tr>
        //                         }
        //                       </tbody>
        //                     </table>
        //                   </span>
        //                 </Col>
        //               </Row>
        //               <Row>
        //                 <Col sm={12}>
        //                 {
        //                   {
        //                     0: <EtherscanLink network={network} type="tx" address={investment.investTxHash} />,
        //                     1: <EtherscanLink network={network} type="tx" address={investment.stopTxHash} />,
        //                     2: <EtherscanLink network={network} type="tx" address={investment.requestTxHash} />,
        //                     3: <EtherscanLink network={network} type="tx" address={investment.requestTxHash} />,
        //                     4: <EtherscanLink network={network} type="tx" address={investment.approveTxHash} />
        //                   }[investment.state]
        //                 }
        //                 </Col>
        //               </Row>
        //               <Row>
        //                 <Col sm={12}>
        //                   <div className="card shadow mb-4">
        //                     <a href={`#investments_${investment.id}_trades`} className="d-block card-header py-2 collapsed" data-toggle="collapse" role="button" aria-expanded="true" aria-controls={`investments_${investment.id}_trades`}>
        //                       <span className="m-0 font-weight-bold text-primary">Trades</span>
        //                     </a>
        //                     <div className="collapse" id={`investments_${investment.id}_trades`}>
        //                       <div className="card-body">
        //                         <a href={dydxUrl} target="_blank" rel="noopener">dydx positions</a>
        //                         <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
        //                           <thead>
        //                             <tr>
        //                               <th>Date</th>
        //                               <th>Nett Profit</th>
        //                             </tr>
        //                           </thead>
        //                           <tbody>
        //                           {
        //                             tradesForInvestment.map((trade) => {
        //                               return (
        //                                 <tr key={trade.id}>
        //                                   <td className="text-muted">{trade.formattedStart}</td>
        //                                   <td className={`text-${trade.profitClass}`}>{trade.formattedProfit}</td>
        //                                 </tr>
        //                               )
        //                             })
        //                           }
        //                           </tbody>
        //                         </table>
        //                       </div>
        //                     </div>
        //                   </div>
        //                 </Col>
        //               </Row>
        //             </div>
        //         }
        //     </div>
        //   </div>
        // )
      })
    }
    </div>
  )
}



function mapStateToProps(state) {
  const account = accountSelector(state)

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
    account: account,
    trader: traderSelector(state, account),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investments: investmentsSelector(state),
    tokens: tokensSelector(state),
    investmentActionRequired: investmentActionRequiredSelector(state)
  }
}

export default connect(mapStateToProps)(TraderInvestments)


