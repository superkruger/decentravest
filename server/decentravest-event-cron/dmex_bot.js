const BigNumber = require('bignumber.js')
const moment = require('moment')
const axios = require('axios')
const _ = require('lodash')

const io = require("socket.io-client")

const processOrderbook = async (hash) => {
	try {

		// const manager = new Manager("wss://api.dmex.app", {
		//   reconnectionDelayMax: 10000,
		//   transports: ['websocket']
		// })

		// const socket = manager.socket("/futures_orderbook_update", {
		  
		// })

		// const socket = io("wss://api.dmex.app", { transports: ['websocket'] })

		const socket = io('wss://api.dmex.app', {
		  path: '/futures',
		  transports: ['websocket']
		})

		console.log(socket)

		socket.on('connect', () => {
			console.log('connected')

			console.log(socket)

			// socket.emit('futures_orderbook_update')
		})

		socket.on("connect_error", (e) => {
		  console.log('connect_error', e)
		})

		socket.on("disconnect", (reason) => {
		  console.log('disconnect', reason)
		})

		// socket.onAny((eventName, ...args) => {
		//   console.log('event', eventName)
		// })

		socket.on('futures_orderbook_update', (...args) => {
			console.log('futures')
		})
		// socket.on('data', (e) => {
		// 	console.log('data', e)
		// })

		// let url = 'https://api.dmex.app/api/futures/orderbook?futures_contract_hash=$1'
		// url = url.replace('$1', hash)

		// const response = await axios.get(url)

		// let asks = _.get(response, "data.data.asks", [])
		// let bids = _.get(response, "data.data.bids", [])

		// let totalAskBTC = 0
		// let totalBidBTC = 0
		// let totalAskUSD = 0
		// let totalBidUSD = 0

		// for (let i=0; i<asks.length; i++) {
		// 	// console.log("BTC pre:", asks[i][0])
		// 	// console.log("BTC post:", parseInt(asks[i][0]) / 10**8)

		// 	let btcAmount = parseInt(asks[i][0]) / 10**8
		// 	let usdAmount = asks[i][1] / 10**11

		// 	totalAskBTC += btcAmount
		// 	totalAskUSD += usdAmount
		// }


		// for (let i=0; i<bids.length; i++) {
		// 	let btcAmount = parseInt(bids[i][0]) / 10**8
		// 	let usdAmount = bids[i][1] / 10**11

		// 	totalBidBTC += btcAmount
		// 	totalBidUSD += usdAmount
		// }

		// console.log(`Total Bid BTC: ${totalBidBTC}`)
		// console.log(`Total Bid USD: ${totalBidUSD}`)
		// console.log(`Total Ask BTC: ${totalAskBTC}`)
		// console.log(`Total Ask USD: ${totalAskUSD}`)

		
	} catch(error) {
	    // handle error
	    console.log(error)
	}
}
exports.processOrderbook = processOrderbook