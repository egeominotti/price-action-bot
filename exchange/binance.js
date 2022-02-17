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
        'BNBUSDT',
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
        'PERPUSDT',
        'BTCSTUSDT',
        'USDPUSDT',
        'USTUSDT',
        'BUSDUSDT',
        'EURUSDT',
        'BTTCUSDT',
        'SHIBUSDT',
        'XMRUSDT',
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


            // [Object: null prototype] {
            //   symbol: 'THETAUSDT',
            //   orderId: 1670146976,
            //   orderListId: -1,
            //   clientOrderId: 'C60Grd7qLs8ASSGttdAmfW',
            //   transactTime: 1644496681243,
            //   price: '0.00000000',
            //   origQty: '3.90000000',
            //   executedQty: '3.90000000',
            //   cummulativeQuoteQty: '14.90580000',
            //   status: 'FILLED',
            //   timeInForce: 'GTC',
            //   type: 'MARKET',
            //   side: 'BUY',
            //   fills: [
            //     [Object: null prototype] {
            //       price: '3.82200000',
            //       qty: '3.90000000',
            //       commission: '0.00002617',
            //       commissionAsset: 'BNB',
            //       tradeId: 124540630
            //     }
            //   ]
            // }

            let qty = sizeTrade / close;
            let stepSize = exchangeInfoArray[symbol].stepSize;
            let buyAmount = userBinance.roundStep(qty, stepSize);

            userBinance
                .marketBuy(symbol, buyAmount)
                .then((r) => {
                    console.log("ACQUISTO: " + symbol)
                    console.log(r)
                }).catch((e) => {
                console.log("ERRORE ACQUISTO: " + symbol)
                console.log(e);
            });
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
                if (!error) {

                    if (balances[replacedSymbol] !== undefined || balances[replacedSymbol] !== null) {

                        let stepSize = exchangeInfoArray[symbol].stepSize;
                        let available = balances[replacedSymbol].available

                        let qty = userBinance.roundStep(available, stepSize);

                        userBinance
                            .marketSell(symbol, qty)
                            .then((r) => {
                                console.log("VENDITA: " + symbol)
                                console.log(r)
                                // if (r.status === 'FILLED') {
                                //     let orderId = r.orderId;
                                //     let clientOrderId = r.clientOrderId;
                                // }

                            }).catch((e) => {
                            console.log("ERRORE VENDITA: " + symbol)
                            console.log(e)
                        });
                    }
                }

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
