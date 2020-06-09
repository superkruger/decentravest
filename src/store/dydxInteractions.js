import axios from 'axios'
import moment from 'moment'
import BigNumber from 'bignumber.js'
import { 
	traderPositionsLoaded,
	traderPositionLoaded
} from './dydxActions.js'
import { etherToWei } from '../helpers'


export const loadTraderPositions = async (account, dispatch) => {
	try {
		// TODO: real account
		axios.get('https://api.dydx.exchange/v1/positions?owner=0x6b98d58200439399218157B4A3246DA971039460')// + account)
		  .then(function (response) {
		    // handle success
		    console.log('Response', response)
		    const mappedPositions = mapTraderPositions(response.data.positions, dispatch)
		    dispatch(traderPositionsLoaded())

		    console.log(mappedPositions)
		  })
		  .catch(function (error) {
		    // handle error
		    console.log(error)
		  })
	} catch (error) {
		console.log('Could not get trader positions', error)
		return null
	}
}

const mapTraderPositions = (positions, dispatch) => {
	const mappedPositions = positions.map((position) => {
		position = mapTraderPosition(position, dispatch)
		return position
	})

	return mappedPositions
}

const mapTraderPosition = (position, dispatch) => {
	const mappedPosition = ({
		uuid: position.uuid,
		type: position.type,
		status: position.status,
		market: position.market,
		createdAt: moment(position.createdAt),
		standardActions: mapStandardActions(position.standardActions)
	})

	dispatch(traderPositionLoaded(mappedPosition))

	return mappedPosition
}

const mapStandardActions = (standardActions) => {
	const mappedStandardActions = standardActions.map((standardAction) => {
		standardAction = mapStandardAction(standardAction)
		return standardAction
	})

	return mappedStandardActions
}

const mapStandardAction = (standardAction) => {
	const transferAmount = new BigNumber(standardAction.transferAmount)
	const price = new BigNumber(standardAction.price)
	let ethTransferAmount = transferAmount.toString()

	if (standardAction.asset === 'DAI') {
		ethTransferAmount = etherToWei(transferAmount.dividedBy(price.times(new BigNumber(10).exponentiatedBy(18)))).toString()
	}

	const mappedStandardAction = ({
		uuid: standardAction.uuid,
		type: standardAction.type,
		transferAmount: transferAmount,
		ethTransferAmount: ethTransferAmount,
		tradeAmount: new BigNumber(standardAction.tradeAmount),
		price: price,
		asset: standardAction.asset,
		side: standardAction.side,
		transactionHash: standardAction.transactionHash,
		confirmedAt: moment(standardAction.confirmedAt),
		feeAmount: new BigNumber(standardAction.feeAmount),
		feeAsset: standardAction.feeAsset
	})

	return mappedStandardAction
}