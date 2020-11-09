import BigNumber from 'bignumber.js'
import {isEqual} from 'lodash'
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Container, Row, Col, Button, Alert } from 'react-bootstrap'
import EtherscanLink from '../containers/EtherscanLink'
import Spinner from '../Spinner'
import ExplodingPieChart from '../cards/ExplodingPieChart'
import PieChart from '../cards/PieChart'
import SmallCurrencyAmounts from '../cards/SmallCurrencyAmounts'
import {
  createWallet,
  loadMainWalletBalances,
  loadInvestorStatistics
} from '../../store/interactions'
import { 
  web3Selector,
  networkSelector,
  accountSelector,
  investorSelector,
  traderPairedSelector,
  walletFactorySelector,
  walletSelector,
  walletCreatingSelector,
  tokensSelector,
  investorStatisticsSelector
} from '../../store/selectors'
import { formatBalance } from '../../helpers'

class Investor extends Component {
  componentDidMount() {
    const { network, account, wallet, tokens, dispatch } = this.props
    if (wallet && wallet.contract && account && network) {
      loadMainWalletBalances(wallet.contract, tokens, dispatch)
      loadInvestorStatistics(account, network, dispatch)
    }
  }

  componentDidUpdate(prevProps) {
    const { network, account, wallet, tokens, dispatch } = this.props

    if (wallet && wallet.contract && 
        ((!prevProps.wallet && wallet.contract) ||
          !isEqual(wallet.contract, prevProps.wallet.contract) || 
          !isEqual(account, prevProps.account) || 
          !isEqual(network, prevProps.network))) {
      loadMainWalletBalances(wallet.contract, tokens, dispatch)
      loadInvestorStatistics(account, network, dispatch)
    }
  }

  render() {
    const { wallet } = this.props

    return (
      <div className="col-sm-12">
        {
          wallet && wallet.contract ?
            <Dashboard props={this.props}/> :
            <CreateWallet props={this.props}/>
        }
      </div>
    )
  }
}

function CreateWallet(props) {
  const { web3, account, traderPaired, walletFactory, walletCreating, dispatch } = props.props
  const handleClick = () => createWallet(account, traderPaired, walletFactory, web3, dispatch)

  return (
    walletCreating ?
    <Spinner />
    :
    <div>
      <Alert variant="info">
        In order to invest, you need to create a private multisignature wallet first.<br/>
        This ensures that your funds are safe and cannot be stolen by any party, including us!
      </Alert>
      <Button
        variant="primary"
        onClick={handleClick}
        >
        Create Wallet
      </Button>
    </div>
  )
}

function Dashboard(props) {

  return (
    <div className="col-sm-12">
      <Container>
        <Row>
          <Col sm={12}>
            <Collateral props={props.props} />
          </Col>
        </Row>
        <br/>
        <Row>
          <Col sm={12}>
            <Direct props={props.props} />
          </Col>
        </Row>
      </Container>
    </div>
  )
}

function Collateral(props) {
  const { investorStatistics } = props.props

  return (
    <div className="card shadow h-100">
      <div className="card-header">
        <h4 className="m-0 font-weight-bold text-primary">
          <Row>
            <Col sm={1}>
              <i className="fas fa-university fa-2x text-gray-300"></i>
            </Col>
            <Col sm={11}>
              <div className="h4 mb-0 mr-3 font-weight-bold text-gray-800">Collateral Investments</div>
            </Col>
          </Row>
        </h4>
      </div>
      <div className="card-body">
        <Row>
          <Col sm={12}>
            <Wallet props={props.props} />
          </Col>
        </Row>
        <br/>
        {
          investorStatistics
          ?  <Container>
              <Row>
                <Col sm={6}>
                  <PieChart title="Past Investments" chartkey="pci" data={mapStatisticsCount(investorStatistics, "0", "approved", true)}/>
                </Col>
                <Col sm={6}>
                  <PieChart title="Current Investments" chartkey="cci" data={mapStatisticsCount(investorStatistics, "0", "approved", false)}/>
                </Col>
              </Row>
              <Row>
                <Col sm={6}>
                  <SmallCurrencyAmounts title="Past Profit" icon="" amounts={mapStatisticsTotal(investorStatistics, "0", "approved", true)}/>
                </Col>
                <Col sm={6}>
                  <SmallCurrencyAmounts title="Current Profit" icon="" amounts={mapStatisticsTotal(investorStatistics, "0", "approved", false)}/>
                </Col>
              </Row>
            </Container>
          : <div/>
        }
      </div>
    </div>
  )
}

function Direct(props) {
  const { investorStatistics } = props.props

  return (
    <div className="card shadow h-100">
      <div className="card-header">
        <h4 className="m-0 font-weight-bold text-primary">
          <Row>
            <Col sm={1}>
              <i className="fas fa-handshake fa-2x text-gray-300"></i>
            </Col>
            <Col sm={11}>
              <div className="h4 mb-0 mr-3 font-weight-bold text-gray-800">Direct Investments</div>
            </Col>
          </Row>
        </h4>
      </div>
      <div className="card-body">
        {
          investorStatistics
          ? <Container> 
              <Row>
                <Col sm={6}>
                  <PieChart title="Past Investments" chartkey="pdi" data={mapStatisticsCount(investorStatistics, "1", "approved", true)}/>
                </Col>
                <Col sm={6}>
                  <PieChart title="Current Investments" chartkey="cdi" data={mapStatisticsCount(investorStatistics, "1", "approved", false)}/>
                </Col>
              </Row>
              <Row>
                <Col sm={6}>
                  <SmallCurrencyAmounts title="Past Profit" icon="" amounts={mapStatisticsTotal(investorStatistics, "1", "approved", true)}/>
                </Col>
                <Col sm={6}>
                  <SmallCurrencyAmounts title="Current Profit" icon="" amounts={mapStatisticsTotal(investorStatistics, "1", "approved", false)}/>
                </Col>
              </Row>
            </Container>
          : <div/>
        }
      </div>
    </div>
  )
}

function Wallet(props) {
  const { wallet } = props.props

  return (
    <div>
      <div className="card border-left-success shadow h-100 py-2">
        <div className="card-body">
          <div className="row no-gutters align-items-center">
            <div className="col mr-2">
              <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                Personal Investment Multisig Wallet Balances:&nbsp;
                <EtherscanLink address={wallet.contract.options.address} />
              </div>
              {
                wallet.balances.map((balance) => {
                  return (
                    <div key={balance.symbol} className="row no-gutters align-items-center">
                      <div className="col-sm-4">
                        <div className="h5 mb-0 mr-3 font-weight-bold text-gray-800">{balance.symbol}</div>
                      </div>
                      <div className="col-sm-8">
                        <div className="h5 mb-0 font-weight-bold text-gray-800">{balance.formatted}</div>
                      </div>
                    </div>
                  )
                })
              }
            </div>
            <div className="col-auto">
              <i className="fas fa-wallet fa-2x text-gray-300"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function mapStatisticsCount(statistics, shouldTypeKey, shouldStateKey, equalToState) {

  let data = []
  for (let assetKey of Object.keys(statistics.counts)) {
    let assetObj = statistics.counts[assetKey]
    let asset = {"category": assetKey}
    let assetCount = 0

    for (let typeKey of Object.keys(assetObj)) {
      if (typeKey !== shouldTypeKey) {
        continue
      }
      let typeObj = assetObj[typeKey]

      for (let stateKey of Object.keys(typeObj)) {
        if (equalToState) {
          if (stateKey !== shouldStateKey) {
            continue
          }
        } else {
           if (stateKey === shouldStateKey) {
            continue
          } 
        }
        let stateObj = typeObj[stateKey]

        for (let sideKey of Object.keys(stateObj)) {
          let sideObj = stateObj[sideKey]
          assetCount = assetCount + sideObj.count
        }
      }
    }
    if (assetCount > 0) {
      asset.value = assetCount
      data.push(asset)
    }
  }

  return data
}

function mapStatisticsTotal(statistics, shouldTypeKey, shouldStateKey, equalToState) {

  let data = []
  for (let assetKey of Object.keys(statistics.counts)) {
    let assetObj = statistics.counts[assetKey]
    let asset = {"name": assetKey}
    let assetCount = 0
    let assetTotal = new BigNumber(0)

    for (let typeKey of Object.keys(assetObj)) {
      if (typeKey !== shouldTypeKey) {
        continue
      }
      let typeObj = assetObj[typeKey]

      for (let stateKey of Object.keys(typeObj)) {
        if (equalToState) {
          if (stateKey !== shouldStateKey) {
            continue
          }
        } else {
           if (stateKey === shouldStateKey) {
            continue
          } 
        }
        let stateObj = typeObj[stateKey]

        for (let sideKey of Object.keys(stateObj)) {
          let sideObj = stateObj[sideKey]
          assetCount = assetCount + sideObj.count
          if (sideKey === "positive") {
            assetTotal = assetTotal.plus(sideObj.total)
          } else {
            assetTotal = assetTotal.minus(sideObj.total)
          }
        }
      }
    }
    if (assetCount > 0) {
      asset.value = formatBalance(assetTotal, assetKey)
      data.push(asset)
    }
  }

  return data
}

function mapStateToProps(state) {
  const account = accountSelector(state)

  return {
    web3: web3Selector(state),
    network: networkSelector(state),
    account: account,
    investor: investorSelector(state),
    traderPaired: traderPairedSelector(state),
    walletFactory: walletFactorySelector(state),
    wallet: walletSelector(state),
    walletCreating: walletCreatingSelector(state),
    tokens: tokensSelector(state),
    investorStatistics: investorStatisticsSelector(state, account)
  }
}

export default connect(mapStateToProps)(Investor)
