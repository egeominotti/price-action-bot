/**
 *
 * @param data
 * @returns {*[]}
 */
function extractPair(data) {

    for (let obj of data.symbols) {

        if (obj.status === 'TRADING' && obj.quoteAsset === 'USDT') {
            let filters = {status: obj.status};
            for (let filter of obj.filters) {
                if (filter.filterType === "MIN_NOTIONAL") {
                    filters.minNotional = filter.minNotional;
                } else if (filter.filterType === "PRICE_FILTER") {
                    filters.minPrice = filter.minPrice;
                    filters.maxPrice = filter.maxPrice;
                    filters.tickSize = filter.tickSize;
                } else if (filter.filterType === "LOT_SIZE") {
                    filters.stepSize = filter.stepSize;
                    filters.minQty = filter.minQty;
                    filters.maxQty = filter.maxQty;
                }
            }
            filters.baseAssetPrecision = obj.baseAssetPrecision;
            filters.quoteAssetPrecision = obj.quoteAssetPrecision;
            filters.icebergAllowed = obj.icebergAllowed;
            exchangeInfoArray[obj.symbol] = filters;
        }
    }

    let exscluded = [
        'BTCUPUSDT',
        'ETHUPUSDT',
        'ADAUPUSDT',
        'LINKUPUSDT',
        'BNBUPUSDT',
        'TRXUPUSDT',
        'XRPUPUSDT',
        'DOTUPUSDT',
        'BTCDOWNUSDT',
        'ETHDOWNUSDT',
        'ADADOWNUSDT',
        'LINKDOWNUSDT',
        'BNBDOWNUSDT',
        'TRXDOWNUSDT',
        'XRPDOWNUSDT',
        'DOTDOWNUSDT',
        'PERPUSDT'
    ]

    let pairs = [];

    for (const pair in exchangeInfoArray) {
        let discard = false;
        for (const exclude of exscluded) {
            if (pair === exclude) {
                discard = true;
            }
        }

        if (!discard) {
            pairs.push(pair);
        }
    }

    return pairs;
}

module.exports = {
    extractPair
}
