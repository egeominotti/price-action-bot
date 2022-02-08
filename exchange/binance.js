/**
 *
 * @param data
 * @returns {*[]}
 */
function initData(data) {

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

    for (let time of timeFrame) {
        for (const symbol of pairs) {

            let key = symbol + "_" + time
            tokenArray[key] = [];
            indexArray[key] = -1;
            exclusionList[key] = false;
            entryCoins[key] = false;
            recordPattern[key] = null;
            takeProfitArray[key] = null;
            stopLossArray[key] = null;
            entryArray[key] = null;
            listEntry[key] = null;
            floatingArr[key] = 0;
            floatingPercArr[key] = 0;
        }
    }

    return pairs;
}

module.exports = {
    initData
}
