import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Form, Button } from 'react-bootstrap'
import BigNumber from 'bignumber.js'
import Spinner from '../Spinner'
import { ZERO_ADDRESS, formatBalance } from '../../helpers'
import { 
  web3Selector,
  accountSelector,
  traderPairedSelector,
  traderAllocationsSelector,
  tokensSelector,
  balancesSelector
} from '../../store/selectors'
import { 
  loadTraderAllocations,
  setTraderAllocation,
  loadBalances
} from '../../store/interactions'

class TraderInvestments extends Component {

  componentDidMount() {
    const { account, traderPaired, tokens, web3, dispatch } = this.props
    loadTraderAllocations(account, traderPaired, dispatch)
    loadBalances(account, traderPaired, tokens, web3, dispatch)
  }

  render() {
    const {traderAllocations} = this.props
    return (
      <Container>
          <Row>
            <Col sm={12}>
              
            </Col>
          </Row>
        </Container>
    )
  }
}

function Balance(props) {
  const {web3, account, tokens, balances} = props.props
  const {symbol} = props

  let balance = 0
  let balanceObj = balances.find(b => b.symbol === symbol)

  if (balanceObj !== undefined) {
    balance = balanceObj.formatted
  }

  return (
    <span>Wallet Balance: {balance}</span>
  )
}

function allocationSubmitHandler (tokenAddress, inputId, decimals, props) {
  const {account, traderPaired, dispatch} = props

  const amount = document.getElementById(inputId).value
  setTraderAllocation(account, tokenAddress, amount, decimals, traderPaired, dispatch)
}

function mapStateToProps(state) {

  return {
    web3: web3Selector(state),
    account: accountSelector(state),
    traderPaired: traderPairedSelector(state),
    traderAllocations: traderAllocationsSelector(state),
    tokens: tokensSelector(state),
    balances: balancesSelector(state)
  }
}

export default connect(mapStateToProps)(TraderInvestments)


