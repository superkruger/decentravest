export function traderPositionsLoaded() {
	return {
		type: 'TRADER_POSITIONS_LOADED'
	}
}

export function traderPositionLoaded(position) {
	return {
		type: 'TRADER_POSITION_LOADED',
		position
	}
}