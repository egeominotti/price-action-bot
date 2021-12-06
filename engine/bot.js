const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const axios = require('axios').default;
const coins = require('../utility/coins');
const Logger = require('../models/logger');
const User = require('../models/user');
const Pattern = require('../pattern/triangle')
const Telegram = require('../utility/telegram');
const analysis = require('../analytics/analysis');
const Strategy = require('../strategy/strategy');
const _ = require("lodash");

const binance = new Binance().options({
    APIKEY: '',
    APISECRET: ''
});

require('dotenv').config();

mongoose.connect(process.env.URI_MONGODB);

let tradeEnabled = true;
let coinsArray = coins.getCoins()

let tokenArray = {}
let exchangeInfoArray = {}
let indexArray = {}
let recordPattern = {}

let balance = 3000
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 20

let timeFrame = [
    '5m',
    '15m',
    '1h',
    '4h',
    '1d',
    '3d',
    '1w',
]

for (let time of timeFrame) {
    for (const token of coinsArray) {
        let key = token + "_" + time
        indexArray[key] = -1;
        tokenArray[key] = [];
        recordPattern[key] = [];
    }
}


function takeProfit(key, close, recordPatternValue, symbol, interval) {

    let entryprice = recordPatternValue['entryprice']
    let entrypricedate = recordPatternValue['entrypricedate']
    let takeprofit = recordPatternValue['takeprofit']
    let strategy = recordPatternValue['strategy']

    if (close >= takeprofit) {

        let finaleTradeValue;

        let takeProfitPercentage = (takeprofit - entryprice) / entryprice
        let finaleSizeTrade = (sizeTrade / entryprice) * takeprofit;

        takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)
        totalPercentage += takeProfitPercentage
        //balance = _.round((balance / entryprice) * takeprofit, 2)

        finaleTradeValue = finaleSizeTrade - sizeTrade

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)


        const logger = new Logger({
            type: 'TAKEPROFIT',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            takeprofitvalue: takeprofit,
            takeprofitpercentage: takeProfitPercentage,
            takeprofitdate: new Date(),
            hh: recordPatternValue['hh'],
            ll: recordPatternValue['ll'],
            lh: recordPatternValue['lh'],
            hl: recordPatternValue['hl'],
            strategy: strategy
        })

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });


        let message = "TAKEPROFIT: " + symbol + "\n" +
            "Interval: " + interval + "\n" +
            "Takeprofit percentage: " + takeProfitPercentage + "%" + "\n" +
            "Balance: " + newBalance + "\n" +
            "Entry Price: " + entryprice + "\n" +
            "Entry date: " + entrypricedate.toUTCString() + "\n" +
            "hh: " + recordPatternValue['hh'] + "\n" +
            "ll: " + recordPatternValue['ll'] + "\n" +
            "lh: " + recordPatternValue['lh'] + "\n" +
            "hl: " + recordPatternValue['hl']

        Telegram.sendMessage(message)
        recordPattern[key] = []

        return true;
    }

    return false;
}

function stopLoss(key, close, recordPatternValue, symbol, interval) {

    let entryprice = recordPatternValue['entryprice']
    let entrypricedate = recordPatternValue['entrypricedate']
    let stoploss = recordPatternValue['stoploss']
    let strategy = recordPatternValue['strategy']

    // Stop Loss
    if (close <= stoploss) {

        let finaleTradeValue;
        let stopLossPercentage = (stoploss - entryprice) / entryprice
        stopLossPercentage = _.round(stopLossPercentage * 100, 2)
        let finaleSizeTrade = (sizeTrade / entryprice) * stoploss;
        finaleTradeValue = finaleSizeTrade - sizeTrade
        totalPercentage += stopLossPercentage

        //balance = _.round((balance / entryprice) * stoploss, 2)

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)

        const logger = new Logger({
            type: 'STOPLOSS',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            stoplossvalue: stoploss,
            stoplosspercentage: stopLossPercentage,
            stoplossdate: new Date(),
            hh: recordPatternValue['hh'],
            ll: recordPatternValue['ll'],
            lh: recordPatternValue['lh'],
            hl: recordPatternValue['hl'],
            strategy: strategy
        })

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });


        let message = "STOPLOSS: " + symbol + "\n" +
            "Interval: " + interval + "\n" +
            "Stop loss percentage: " + stopLossPercentage + "%" + "\n" +
            "Balance: " + newBalance + "\n" +
            "Entry Price: " + entryprice + "\n" +
            "Entry date: " + entrypricedate.toUTCString() + "\n" +
            "hh: " + recordPatternValue['hh'] + "\n" +
            "ll: " + recordPatternValue['ll'] + "\n" +
            "lh: " + recordPatternValue['lh'] + "\n" +
            "hl: " + recordPatternValue['hl']

        Telegram.sendMessage(message)
        recordPattern[key] = []

        return true;
    }

    return false;
}


async function exchangeInfo() {

    binance.exchangeInfo(function (error, data) {

            // INIT EXCHANGE INFO
            for (let obj of data.symbols) {

                if (coinsArray.indexOf(obj.symbol) !== -1) {
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
        }
    );

}


function websocketsAnalyser() {

    // // INIT WEBSOCKET
    for (let time of timeFrame) {

        console.log(tokenArray)
        let startMessage = 'Bot Pattern Analysis System Started for interval: ' + time
        Telegram.sendMessage(startMessage)

        binance.websockets.candlesticks(coinsArray, time, (candlesticks) => {

            let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
            let {
                o: open,
                h: high,
                l: low,
                c: close,
                i: interval,
                x: isFinal,
            } = ticks;

            let key = symbol + "_" + interval

            if (!_.isEmpty(recordPattern[key])) {

                const recordPatternValue = _.head(recordPattern[key]);
                if (recordPatternValue['confirmed'] === true) {

                    let stoploss = stopLoss(key, close, recordPatternValue, symbol, interval)
                    let takeprofit = takeProfit(key, close, recordPatternValue, symbol, interval)

                    if (stoploss || takeprofit) {

                        if (tradeEnabled) {

                            binance.balance((error, balances) => {
                                if (error) return console.error(error);
                                console.log(exchangeInfoArray[symbol])
                                let sellAmount = binance.roundStep(balances[symbol].available, exchangeInfoArray[symbol].stepSize);
                                binance.marketSell(symbol, sellAmount);
                            });
                        }
                    }

                }
            }

            // Check at close tick
            if (isFinal) {

                //let dataValue = new Date();
                //let hour = dataValue.getUTCHours();
                //if (hour <= 0 || hour >= 5) {

                // if (!_.isEmpty(tokenArray[key])) {
                //     let pattern = Pattern.patternMatching(tokenArray[key], symbol)
                //     if (!_.isEmpty(pattern)) {
                //
                //         let recordPatternData = {
                //             'symbol': symbol,
                //             'interval': interval,
                //             'hh': pattern['hh'],
                //             'll': pattern['ll'],
                //             'lh': pattern['lh'],
                //             'hl': pattern['hl'],
                //             'hh_close': pattern['hh_close'],
                //             'll_open': pattern['ll_open'],
                //             'll_close': pattern['ll_close'],
                //             'lh_close': pattern['lh_close'],
                //             'hl_open': pattern['hl_open'],
                //             'confirmed': false
                //         }
                //
                //         recordPattern[key].push(recordPatternData)
                //         tokenArray[key] = [];
                //         indexArray[key] = -1
                //
                //     }
                // }

                if (_.isEmpty(recordPattern[key])) {

                    indexArray[key] += 1

                    let ticker = {
                        'index': parseInt(indexArray[key]),
                        'symbol': symbol.toString(),
                        'open': parseFloat(open),
                        'close': parseFloat(close),
                        'low': parseFloat(low),
                        'high': parseFloat(high),
                        'interval': interval.toString(),
                        'time': new Date()
                    }

                    tokenArray[key].push(ticker)

                    let pattern = Pattern.patternMatching(tokenArray[key], symbol)

                    if (!_.isEmpty(pattern)) {

                        let recordPatternData = {
                            'symbol': symbol,
                            'interval': interval,
                            'hh': pattern['hh'],
                            'll': pattern['ll'],
                            'lh': pattern['lh'],
                            'hl': pattern['hl'],
                            'hh_close': pattern['hh_close'],
                            'll_open': pattern['ll_open'],
                            'll_close': pattern['ll_close'],
                            'lh_close': pattern['lh_close'],
                            'hl_open': pattern['hl_open'],
                            'confirmed': false
                        }

                        recordPattern[key].push(recordPatternData)
                        tokenArray[key] = [];
                        indexArray[key] = -1

                    }


                } else {

                    let recordPatternValue = _.head(recordPattern[key]);
                    console.log(recordPatternValue)
                    if (recordPatternValue['confirmed'] === false) {

                        if (low < recordPatternValue['ll'] || close > recordPatternValue['hh']) {
                            recordPattern[key] = []
                        } else {

                            let isStrategyBreakoutFound = Strategy.strategyBreakout(symbol, interval, close, recordPatternValue)

                            if (isStrategyBreakoutFound) {
                                if (tradeEnabled) {

                                    console.log(exchangeInfoArray[symbol])
                                    const binance = new Binance().options({
                                        APIKEY: 'g4m5LHCwMI1evVuaf6zgKXtszDnSboQla5O5c7uWVtBmdbaiTLNQWPnO9ImbYB9U',
                                        APISECRET: 'b2kxHirJLXDrXuFGvLWUtXvRyUXQu4NvsY8lSy94bJjnJFn0SmESuBq60DJi9b0B'
                                    });

                                    let buyAmount = binance.roundStep(sizeTrade / close, exchangeInfoArray[symbol].stepSize);
                                    binance.marketBuy(symbol, buyAmount);
                                }
                            }
                            console.log(recordPatternValue)

                            // try {
                            //     let symbolReplaced = symbol.replace('USDT', '/USDT')
                            //     axios.get('https://api.taapi.io/ema', {
                            //         params: {
                            //             secret: process.env.API_KEY_TAAPI,
                            //             exchange: "binance",
                            //             symbol: symbolReplaced,
                            //             interval: interval,
                            //             optInTimePeriod: 200
                            //         }
                            //     })
                            //         .then(function (response) {
                            //             let ema = response.data['value']
                            //             console.log(ema)
                            //             if (ema < close) {
                            //                 Strategy.strategyBreakout(symbol, interval, close, tradeEnabled, apiUrlTrade, recordPatternValue)
                            //                 console.log(recordPatternValue)
                            //             } else {
                            //                 recordPattern[key] = []
                            //             }
                            //         })
                            //         .catch(function (error) {
                            //             console.log(error.response.data);
                            //             console.log("Error:" + error.response.data)
                            //             Telegram.sendMessage('Error: ' + error.response.data)
                            //         });
                            //
                            //
                            // } catch (e) {
                            //     Telegram.sendMessage('Error: ' + e.toString())
                            // }

                        }
                    }
                }
            }

        });
    }
}

async function initValue(token, time, candle) {
    return new Promise(function (resolve, reject) {
        binance.candlesticks(token, time, (error, ticks, symbol) => {

            const key = token + "_" + time

            let indexOrder = 1

            indexArray[key] = -1;
            tokenArray[key] = [];
            recordPattern[key] = [];

            if (error !== null) reject()

            if (!_.isEmpty(ticks)) {
                // TOOO: remove last element
                for (let t of ticks) {

                    if (indexOrder <= ticks.length - 1) {

                        indexArray[key] += 1

                        let [time, open, high, low, close, ignored] = t;
                        let ticker = {
                            'index': parseInt(indexArray[key]),
                            'symbol': symbol,
                            'open': parseFloat(open),
                            'close': parseFloat(close),
                            'low': parseFloat(low),
                            'high': parseFloat(high),
                            'time': time,
                        }

                        tokenArray[key].push(ticker)
                        indexOrder++;
                    }
                }
                resolve()
            }

        }, {limit: candle});
    });
}


async function init(candle) {

    return new Promise(async function (resolve, reject) {

        for (const token of coinsArray) {
            for (let time of timeFrame) {
                initValue(token, time, candle).then(() => console.log("Scaricato " + token + " " + time)).catch(() => reject())
                await new Promise(r => setTimeout(r, 50));
            }
        }
        resolve()
    });

}


(async () => {

    try {

        init(100).then(() => {
            //console.log(tokenArray)
            console.log("BOT STARTED")
            exchangeInfo();
            websocketsAnalyser();
        })

    } catch (e) {
        console.log(e)
    }
})();






