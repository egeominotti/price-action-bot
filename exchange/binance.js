const Bot = require("../models/bot");

/**
 *
 * @param obj
 * @returns {Promise<unknown>}
 */
function exchangeInfo(obj) {

    let binance = obj.binance;
    let timeFrame = obj.timeFrame;
    let exclusionList = obj.exclusionList;
    let indexArray = obj.indexArray;
    let recordPattern = obj.recordPattern;
    let tokenArray = obj.tokenArray;
    let exchangeInfoArray = obj.exchangeInfoArray;
    let entryArray = obj.entryArray;
    let takeProfitArray = obj.takeProfitArray;
    let stopLossArray = obj.stopLossArray;
    let floatingArr = obj.floatingArr;
    let floatingPercArr = obj.floatingPercArr;
    let entryCoins = obj.entryCoins;
    let dbKey = obj.dbKey;

    return new Promise(async function (resolve, reject) {

        binance.exchangeInfo(async function (error, data) {

                if (error !== null) reject(error);

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
                    'DOTDOWNUSDT'
                ]

                let pairs = [];

                for (const pair in exchangeInfoArray) {

                    let discard = false;

                    for (const exclude of exscluded) {
                        if (pair === exclude){
                            discard = true;
                        }
                    }

                    if (!discard) {
                        pairs.push(pair);
                    }

                }


                for (let time of timeFrame) {
                    for (const token of pairs) {

                        let key = token + "_" + time

                        exclusionList[key] = false;
                        indexArray[key] = -1;
                        tokenArray[key] = [];
                        entryCoins[key] = false;
                        recordPattern[key] = null;
                        takeProfitArray[key] = null;
                        stopLossArray[key] = null;
                        entryArray[key] = null;
                        // Floating percentage
                        floatingArr[key] = 0;
                        floatingPercArr[key] = 0;
                    }
                }

                // const dbData = await Bot.findOne({name: dbKey});
                // if (dbData !== null) {
                //
                //     tokenArray = dbData.tokenArray;
                //     indexArray = dbData.indexArray;
                //     exchangeInfoArray = dbData.exchangeInfoArray;
                //     recordPattern = dbData.recordPattern;
                //     exclusionList = dbData.exclusionList;
                //     entryCoins = dbData.entryCoins;
                //     takeProfitArray = dbData.takeProfitArray;
                //     stopLossArray = dbData.stopLossArray;
                //     entryArray = dbData.entryArray;
                //
                // } else {
                //
                //     for (let time of timeFrame) {
                //         for (const token in exchangeInfoArray) {
                //
                //             let key = token + "_" + time
                //
                //             exclusionList[key] = false;
                //             indexArray[key] = -1;
                //             tokenArray[key] = [];
                //             entryCoins[key] = false;
                //             recordPattern[key] = null;
                //             takeProfitArray[key] = null;
                //             stopLossArray[key] = null;
                //             entryArray[key] = null;
                //         }
                //     }
                //
                //     await Bot.create({
                //         name: dbKey,
                //         exchangeInfoArray: exchangeInfoArray,
                //         tokenArray: tokenArray,
                //         indexArray: indexArray,
                //         recordPattern: recordPattern,
                //         exclusionList: exclusionList,
                //         entryCoins: entryCoins,
                //         takeProfitArray: takeProfitArray,
                //         stopLossArray: stopLossArray,
                //         entryArray: entryArray,
                //     })
                // }

                // let startMessage = 'Multipattern Bot Pattern Analysis Engine System Started';
                // Telegram.sendMessage(startMessage)

                resolve(pairs)
            }
        );

    });
}

module.exports = {
    exchangeInfo,
}
