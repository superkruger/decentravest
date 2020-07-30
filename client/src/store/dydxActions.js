export function positionsCountLoaded(count) {
	return {
		type: 'POSITIONS_COUNT_LOADED',
		count
	}
}

export function traderPositionLoaded(position) {
	return {
		type: 'TRADER_POSITION_LOADED',
		position
	}
}

export function traderRatingsLoaded(trader, ratings) {
	return {
		type: 'TRADER_RATINGS_LOADED',
		trader,
		ratings
	}
}