const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const coins = require('../utility/coins');
const Logger = require('../models/logger');
const Pattern = require('../pattern/triangle')
const Telegram = require('../utility/telegram');
const Strategy = require('../strategy/strategy');

// const axios = require('axios').default;
// const User = require('../models/user');
// const analysis = require('../analytics/analysis');

const _ = require("lodash");
const EMA = require('technicalindicators').EMA
const binance = new Binance().options({
    useServerTime: true,
    recvWindow: 60000, // Set a higher recvWindow to increase response timeout
    verbose: true, // Add extra output when subscribing to WebSockets, etc
    log: log => {
        console.log(log); // You can create your own logger here, or disable console output
    }
});

require('dotenv').config();

mongoose.connect(process.env.URI_MONGODB);

let tradeEnabled = false;
let coinsArray = coins.getCoins()

let tokenArray = {}
let exchangeInfoArray = {}
let indexArray = {}
let recordPattern = {}
let exclusionList = {}

let balance = 3000
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;


let timeFrame = [
    '5m',
    '15m',
    '1h',
    '4h',
]


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

        finaleTradeValue = finaleSizeTrade - sizeTrade

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)


        // const logger = new Logger({
        //     type: 'TAKEPROFIT',
        //     symbol: symbol,
        //     interval: interval,
        //     balance: newBalance,
        //     entryprice: entryprice,
        //     entrypricedate: entrypricedate,
        //     takeprofitvalue: takeprofit,
        //     takeprofitpercentage: takeProfitPercentage,
        //     takeprofitdate: new Date(),
        //     hh: recordPatternValue['hh'],
        //     ll: recordPatternValue['ll'],
        //     lh: recordPatternValue['lh'],
        //     hl: recordPatternValue['hl'],
        //     strategy: strategy
        // })
        //
        // logger.save().then((result) => {
        //     console.log(result)
        // }).catch((err) => {
        //     console.log(err)
        // });


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
        recordPattern[key] = null;

        // Add pair with key to exclusion list
        exclusionList[key] = true;
        console.log(exclusionList)

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

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)

        // const logger = new Logger({
        //     type: 'STOPLOSS',
        //     symbol: symbol,
        //     interval: interval,
        //     balance: newBalance,
        //     entryprice: entryprice,
        //     entrypricedate: entrypricedate,
        //     stoplossvalue: stoploss,
        //     stoplosspercentage: stopLossPercentage,
        //     stoplossdate: new Date(),
        //     hh: recordPatternValue['hh'],
        //     ll: recordPatternValue['ll'],
        //     lh: recordPatternValue['lh'],
        //     hl: recordPatternValue['hl'],
        //     strategy: strategy
        // })
        //
        // logger.save().then((result) => {
        //     console.log(result)
        // }).catch((err) => {
        //     console.log(err)
        // });


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
        recordPattern[key] = null;

        return true;
    }

    return false;
}

async function calculateEMA(token, time, candle, period) {
    return new Promise(function (resolve, reject) {

        binance.candlesticks(token, time, (error, ticks, symbol) => {

            let closeArray = [];
            if (error !== null) reject()

            if (!_.isEmpty(ticks)) {

                for (let t of ticks) {
                    let [time, open, high, low, close, ignored] = t;
                    closeArray.push(parseFloat(close));
                }
                closeArray.pop()
                let ema = EMA.calculate({period: period, values: closeArray})
                resolve(_.last(ema))
            }

        }, {limit: candle});

    });
}

async function exchangeInfo() {

    return new Promise(async function (resolve, reject) {

        binance.exchangeInfo(function (error, data) {

                if (error !== null) reject(error);

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
                resolve()
            }
        );

    });
}

async function engine() {

    for (let time of timeFrame) {

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

            let currentClose = parseFloat(close)
            let key = symbol + "_" + interval

            // check in real time - takeprofit and stoploss
            if (recordPattern[key] !== null) {

                let recordPatternValue = recordPattern[key];
                if (recordPatternValue['confirmed'] === true) {

                    let stoploss = stopLoss(key, currentClose, recordPatternValue, symbol, interval)
                    let takeprofit = takeProfit(key, currentClose, recordPatternValue, symbol, interval)

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

                if (exclusionList[key] === true) {

                    let dataValue = new Date();
                    let hour = dataValue.getUTCHours();
                    let minutes = dataValue.getUTCMinutes();

                    // if midnight and zero minutes then unlock pair
                    if (hour === 0 && minutes === 0) {
                        exclusionList[key] = false;
                    }

                }


                if (exclusionList[key] === false) {

                    calculateEMA(symbol, interval, 250, 200).then(function (ema) {

                        if (currentClose < ema) {

                            // salvano i dati delle candele

                            if (recordPattern[key]['confirmed'] === false) {
                                recordPattern[key] = null;
                                indexArray[key] = -1;
                                tokenArray[key] = [];
                            }
                            // il pattern trovato

                        }

                        if (currentClose > ema) {

                            console.log("SCANNING... ema below close price: " + symbol + " - " + interval + " - EMA200: " + _.round(ema, 4) + " - Close: " + currentClose)

                            // Cerco il pattern per la n-esima pair se il prezzo è sopra l'ema
                            if (recordPattern[key] == null) {

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
                                recordPattern[key] = {'confirmed': false}

                                let pattern = Pattern.patternMatching(tokenArray[key], symbol)

                                if (!_.isEmpty(pattern)) {

                                    recordPattern[key] = {
                                        'symbol': symbol,
                                        'interval': interval,
                                        'hh': pattern['hh'],
                                        'll': pattern['ll'],
                                        'lh': pattern['lh'],
                                        'hl': pattern['hl'],
                                        'hh_close': pattern['hh_close'],
                                        'll_open': pattern['ll_open'],
                                        'll_low': pattern['ll_low'],
                                        'll_close': pattern['ll_close'],
                                        'lh_close': pattern['lh_close'],
                                        'hl_open': pattern['hl_open'],
                                        'hh_high': pattern['hh_high'],
                                        'confirmed': false
                                    }

                                    tokenArray[key] = [];
                                    indexArray[key] = -1
                                }
                            }


                            // Se il pattern esiste provo a confermarlo sempre se il prezzo è sopra l'ema
                            if (recordPattern[key] != null) {

                                let recordPatternValue = recordPattern[key];
                                if (recordPatternValue['confirmed'] === false) {

                                    if (low < recordPatternValue['ll'] || currentClose > recordPatternValue['hh']) {
                                        recordPattern[key] = null;
                                    } else {

                                        let isStrategyBreakoutFound = Strategy.strategyBreakout(symbol, interval, currentClose, recordPatternValue)
                                        if (isStrategyBreakoutFound) {

                                            if (tradeEnabled) {
                                                console.log(exchangeInfoArray[symbol])
                                                let buyAmount = binance.roundStep(sizeTrade / currentClose, exchangeInfoArray[symbol].stepSize);
                                                binance.marketBuy(symbol, buyAmount);
                                            }

                                        }
                                        console.log(recordPatternValue)
                                    }
                                }
                            }

                        }

                    }).catch(
                        function () {

                            console.log("Error: Can't calculate EMA for symbol rest engine for: " + symbol)

                            indexArray[key] = -1;
                            tokenArray[key] = [];
                            recordPattern[key] = null;

                        }
                    )
                    // end calculate ema
                }
            }


        });
    }
}


(async () => {

    try {

        for (let time of timeFrame) {
            for (const token of coinsArray) {

                let key = token + "_" + time

                exclusionList[key] = false;
                indexArray[key] = -1;
                tokenArray[key] = [];
                recordPattern[key] = null;
            }
        }

        exchangeInfo().then(() => {
            engine();
        })

    } catch (e) {
        console.log(e)
    }

})();






