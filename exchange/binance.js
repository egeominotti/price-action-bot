const Binance = require("node-binance-api");

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

/**
 *
 * @param symbol
 * @param close
 */
function buy(symbol, close) {

    try {

        if (tradeEnabled) {
            const userBinance = new Binance().options({
                APIKEY: '46AQQyECQ8V56kJcyUSTjrDNPz59zRS6J50qP1UVq95hkqBqMYjBS8Kxg8xumQOI',
                APISECRET: 'DKsyTKQ6UueotZ7d9FlXNDJAx1hSzT8V09G58BGgA85O6SVhlE1STWLWwEMEFFYa',
            });

            let buyAmount = userBinance.roundStep(sizeTrade / close, exchangeInfoArray[symbol].stepSize);
            userBinance.marketBuy(symbol, buyAmount);
        }

    } catch (e) {
        console.log(e)
        return e;
    }
}

/**
 *
 * @param symbol
 */
function sell(symbol) {

    let replacedSymbol = symbol.replace('USDT', '')

    try {

        if (tradeEnabled) {
            const userBinance = new Binance().options({
                APIKEY: '46AQQyECQ8V56kJcyUSTjrDNPz59zRS6J50qP1UVq95hkqBqMYjBS8Kxg8xumQOI',
                APISECRET: 'DKsyTKQ6UueotZ7d9FlXNDJAx1hSzT8V09G58BGgA85O6SVhlE1STWLWwEMEFFYa',
            });

            userBinance.balance((error, balances) => {

                if (error) return console.error(error);
                let qty = userBinance.roundStep(balances[replacedSymbol].available, exchangeInfoArray[symbol].stepSize);
                userBinance.marketSell(symbol, qty);
            });
        }

    } catch (e) {
        console.log(e)
        return e;
    }
}

module.exports = {
    sell,
    buy,
    initData,
}
