const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const logic = require('./logic');
const axios = require('axios').default;
const coins = require('./coins');
const Logger = require('./models/logger');
const fs = require('fs');
const taapi = require("taapi");
const _ = require("lodash");
const binance = new Binance();
const args = process.argv;
const uri = process.env.URI_MONGODB;
require('dotenv').config();

mongoose.connect(uri);


const client = taapi.client(process.env.API_KEY_TAAPI);

let timeFrame = args[2]
let coinsArray = coins.getCoins()
let tokenArray = {}
let indexArray = {}
let recordPattern = {}
let tradeEnabled = false;
let apiUrlTrade = process.env.URI_API_TRADE;


let balance = 5000
let totalPercentage = 0

let isTelegramEnabled;
if (process.env.ENV === 'production') {
    isTelegramEnabled = true
} else {
    isTelegramEnabled = false
}


if (isTelegramEnabled) {
    let startMessage = 'Bot Pattern Analysis System Started for interval: ' + timeFrame
    logic.sendMessageTelegram(startMessage)
}

for (const token of coinsArray) {
    indexArray[token] = -1;
    tokenArray[token] = [];
    recordPattern[token] = [];
}

binance.websockets.candlesticks(coinsArray, timeFrame, (candlesticks) => {

    let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
    let {
        o: open,
        h: high,
        l: low,
        c: close,
        i: interval,
        x: isFinal,
    } = ticks;

    // let dataValue = new Date();
    // let hour = dataValue.getHours();
    // if (hour < 1 && hour > 6) {}

    if (!_.isEmpty(recordPattern[symbol])) {
        const recordPatternValue = _.head(recordPattern[symbol]);
        if (recordPatternValue['confirmed'] === true) {

            let entryprice = recordPatternValue['entryprice']
            let takeprofit = recordPatternValue['takeprofit']
            let stoploss = recordPatternValue['stoploss']

            // Stop Loss
            if (close <= stoploss) {

                let stopLossPercentage = (stoploss - entryprice) / entryprice
                stopLossPercentage = _.round(stopLossPercentage * 100, 2)

                totalPercentage += stopLossPercentage

                balance = _.round((balance / entryprice) * stoploss, 2)

                if (tradeEnabled) {

                    let body = {
                        action: 'SELL',
                        exchange: 'BINANCE',
                        ticker: symbol,
                        asset: 'USDT',
                        coins: coinsArray.length
                    }

                    axios.post(apiUrlTrade, body)
                        .then(function (response) {
                            console.log(response);
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }

                const logger = new Logger({
                    symbol: symbol,
                    interval: interval,
                    balance: balance,
                    entrydata: recordPatternValue['entryData'],
                    stoplosspercentage: stopLossPercentage,
                    hh: recordPatternValue['hh'],
                    ll: recordPatternValue['ll'],
                    lh: recordPatternValue['lh'],
                    hl: recordPatternValue['hl']
                })

                logger.save().then((result) => {
                    console.log(result)
                }).catch((err) => {
                    console.log(err)
                });


                if (isTelegramEnabled) {

                    let message = "Symbol: " + symbol + "\n" +
                        "Interval: " + interval + "\n" +
                        "Balance: " + balance + "\n" +
                        "Entry data: " + recordPatternValue['entryData'] + "\n" +
                        "Stop loss percentage: " + stopLossPercentage + "%" + "\n" +
                        "hh: " + recordPatternValue['hh'] + "\n" +
                        "ll: " + recordPatternValue['ll'] + "\n" +
                        "lh: " + recordPatternValue['lh'] + "\n" +
                        "hl: " + recordPatternValue['hl']

                    logic.sendMessageTelegram(message)
                }

                recordPattern[symbol] = []

            }

            // TAKE PROFIT
            if (close >= takeprofit) {

                let takeProfitPercentage = (takeprofit - entryprice) / entryprice

                takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)

                totalPercentage += takeProfitPercentage

                balance = _.round((balance / entryprice) * takeprofit, 2)

                if (tradeEnabled) {

                    let body = {
                        action: 'SELL',
                        exchange: 'BINANCE',
                        ticker: symbol,
                        asset: 'USDT',
                        coins: coinsArray.length
                    }

                    axios.post(apiUrlTrade, body)
                        .then(function (response) {
                            console.log(response);

                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                }

                const logger = new Logger({
                    symbol: symbol,
                    interval: interval,
                    balance: balance,
                    entrydata: recordPatternValue['entryData'],
                    takeprofitpercentage: takeProfitPercentage,
                    hh: recordPatternValue['hh'],
                    ll: recordPatternValue['ll'],
                    lh: recordPatternValue['lh'],
                    hl: recordPatternValue['hl']
                })

                logger.save().then((result) => {
                    console.log(result)
                }).catch((err) => {
                    console.log(err)
                });

                if (isTelegramEnabled) {
                    let message = "Symbol: " + symbol + "\n" +
                        "Interval: " + interval + "\n" +
                        "Balance: " + balance + "\n" +
                        "Entry data: " + recordPatternValue['entryData'] + "\n" +
                        "Takeprofit percentage: " + takeProfitPercentage + "%" + "\n" +
                        "hh: " + recordPatternValue['hh'] + "\n" +
                        "ll: " + recordPatternValue['ll'] + "\n" +
                        "lh: " + recordPatternValue['lh'] + "\n" +
                        "hl: " + recordPatternValue['hl']

                    logic.sendMessageTelegram(message)
                }

                recordPattern[symbol] = []

            }

        }
    }

    // Controllo alla chiusura della candela
    if (isFinal) {

        if (_.isEmpty(recordPattern[symbol])) {

            indexArray[symbol] += 1

            let ticker = {
                'index': parseInt(indexArray[symbol]),
                'symbol': symbol.toString(),
                'open': parseFloat(open),
                'close': parseFloat(close),
                'low': parseFloat(low),
                'high': parseFloat(high),
                'interval': interval.toString(),
                'time': new Date()
            }

            tokenArray[symbol].push(ticker)
            let pattern = logic.patternMatching(tokenArray[symbol], symbol)
            if (!_.isEmpty(pattern)) {

                let recordPatternData = {
                    'symbol': symbol,
                    'entryprice': 0,
                    'takeprofit': pattern['takeprofit'],
                    'stoploss': pattern['stoploss'],
                    'hh': pattern['hh'],
                    'll': pattern['ll'],
                    'lh': pattern['lh'],
                    'hl': pattern['hl'],
                    'confirmed': false,
                    'entryData': null
                }

                recordPattern[symbol].push(recordPatternData)

                tokenArray[symbol] = [];
                indexArray[symbol] = -1
            }

        } else {

            const recordPatternValue = _.head(recordPattern[symbol]);
            console.log(recordPatternValue);

            if (recordPatternValue['confirmed'] === false) {

                if (low < recordPatternValue['ll'] || close > recordPatternValue['hh']) {
                    recordPattern[symbol] = []
                } else {

                    if (close > recordPatternValue['lh']) {

                        let symbolReplaced = symbol.replace('USDT', '/USDT')
                        console.log(symbolReplaced)

                        // Filter with ema = 200
                        client.getIndicator("ema", "binance", symbolReplaced, interval, {optInTimePeriod: 200}).then(function (result) {

                            console.log("Result: ", result);
                            console.log(result)

                            if (result['value'] < close) {

                                if (tradeEnabled) {

                                    let body = {
                                        action: 'BUY',
                                        exchange: 'BINANCE',
                                        ticker: symbol,
                                        asset: 'USDT',
                                        coins: coinsArray.length
                                    }

                                    axios.post(apiUrlTrade, body)
                                        .then(function (response) {
                                            console.log(response);
                                        })
                                        .catch(function (error) {
                                            console.log(error);
                                        });
                                }

                                if (isTelegramEnabled) {

                                    let message = "Symbol: " + symbol + "\n" +
                                        "Interval: " + interval + "\n" +
                                        "Entry found at: " + new Date().toISOString() + "\n" +
                                        "takeprofit: " + recordPatternValue['takeprofit'] + "\n" +
                                        "stoploss:  " + recordPatternValue['stoploss'] + "\n" +
                                        "hh: " + recordPatternValue['hh'] + "\n" +
                                        "ll: " + recordPatternValue['ll'] + "\n" +
                                        "lh: " + recordPatternValue['lh'] + "\n" +
                                        "hl: " + recordPatternValue['hl']

                                    logic.sendMessageTelegram(message)
                                }

                                recordPatternValue['confirmed'] = true
                                recordPatternValue['entryprice'] = close
                                recordPatternValue['entryData'] = new Date().toString()
                            } else {
                                // Open short position
                                recordPattern[symbol] = []
                            }
                        });


                    }
                }
            }

        }
    }

});
