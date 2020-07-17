import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import AddressLink from '../AddressLink'
import Spinner from '../Spinner'
import { ZERO_ADDRESS, formatBalance } from '../../helpers'
import { 
  investorSelector,
  traderPairedSelector,
  pairedInvestmentsSelector,
  investorInvestmentsSelector
} from '../../store/selectors'
import { 
  loadInvestorInvestments
} from '../../store/interactions'

class InvestorInvestments extends Component {

  componentDidMount() {
    const { investor, traderPaired, pairedInvestments, tokens, dispatch } = this.props
    loadInvestorInvestments(investor, traderPaired, pairedInvestments, dispatch)
  }

  render() {
    const {investorInvestments} = this.props
    return (
      <Container>
          <Row>
            <Col sm={12}>
                <div className="card shadow mb-4">
                  <a href="#investments" className="d-block card-header py-3" data-toggle="collapse" role="button" aria-expanded="true" aria-controls="investments">
                    <h6 className="m-0 font-weight-bold text-primary">Investments</h6>
                  </a>
                  <div className="collapse show" id="investments">
                    <div className="card-body">
                      <table className="table table-bordered table-light table-sm small" id="dataTable" width="100%">
                        <thead>
                          <tr>
                            <th>Trader</th>
                            <th>Token</th>
                            <th>Amount</th>
                            <th>Value</th>
                            <th>State</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        { showInvestments(investorInvestments) }
                      </table>
                    </div>
                  </div>
                </div>
            </Col>
          </Row>
        </Container>
    )
  }
}

function showInvestments(investments) {

  return (
    <tbody>
    { investments.map((investment) => {
        console.log(investment)
        return (
            <tr key={investment.id}>
              <td className="text-muted"><AddressLink address={investment.trader}/></td>
              <td>{investment.token}</td>
              <td>{investment.formattedAmount}</td>
              <td className={`text-${investment.profitClass}`}>{investment.formattedValue}</td>
              <td>{investment.state}</td>
              <td></td>
            </tr>
        )
      })
    }
    </tbody>
  )
}

function mapStateToProps(state) {

  return {
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    pairedInvestments: pairedInvestmentsSelector(state),
    investorInvestments: investorInvestmentsSelector(state)
  }
}

export default connect(mapStateToProps)(InvestorInvestments)


