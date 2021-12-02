const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const axios = require('axios').default;
const coins = require('../utility/coins');
const Logger = require('../models/logger');
const Pattern = require('../pattern/triangle')
const Telegram = require('../utility/telegram');
const analysis = require('../analytics/analysis');
const Strategy = require('../strategy/strategy');
const _ = require("lodash");
const binance = new Binance();

require('dotenv').config();

const apiUrlTrade = process.env.URI_API_TRADE;

mongoose.connect(process.env.URI_MONGODB);

let tradeEnabled = false;
let coinsArray = coins.getCoins()

let tokenArray = {}
let indexArray = {}
let recordPattern = {}

let timeFrame = [
    '5m',
    '15m',
    '45m',
    '1h',
    '4h',
    '1D',
    '3D',
    '1W',
]

for (let time of timeFrame) {
    for (const token of coinsArray) {
        let key = token + "_" + time
        indexArray[key] = -1;
        tokenArray[key] = [];
        recordPattern[key] = [];
    }
}


// Send updated balance on instagram each 4 hours
//analysis.getBalance();

let balance = 3000
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200

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


        if (tradeEnabled) {

            let body = {
                action: 'SELL',
                exchange: 'BINANCE',
                ticker: symbol,
                asset: 'USDT',
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
    }
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

        if (tradeEnabled) {

            let body = {
                action: 'SELL',
                exchange: 'BINANCE',
                ticker: symbol,
                asset: 'USDT',
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
    }
}


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

        let key = symbol + "_" + interval

        if (!_.isEmpty(recordPattern[key])) {

            const recordPatternValue = _.head(recordPattern[key]);
            if (recordPatternValue['confirmed'] === true) {
                stopLoss(key, close, recordPatternValue, symbol, interval)
                takeProfit(key, close, recordPatternValue, symbol, interval)
            }
        }

        // Check at close tick
        if (isFinal) {

            //let dataValue = new Date();
            //let hour = dataValue.getUTCHours();
            //if (hour <= 0 || hour >= 5) {

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

                        let symbolReplaced = symbol.replace('USDT', '/USDT')

                        try {

                            axios.get('https://api.taapi.io/ema', {
                                params: {
                                    secret: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVnZW9taW5vdHRpQGdtYWlsLmNvbSIsImlhdCI6MTYzODM5MjA1NSwiZXhwIjo3OTQ1NTkyMDU1fQ.N6fSSuYwMI4-eD8N9GTi7I29oF_l3Zjj_vgWtUv-_NM',
                                    exchange: "binance",
                                    symbol: symbolReplaced,
                                    interval: interval,
                                    optInTimePeriod: 200
                                }
                            })
                                .then(function (response) {
                                    let ema = response.data['value']
                                    console.log(ema)
                                    if (ema < close) {
                                        Strategy.strategyBreakout(symbol, interval, close, tradeEnabled, apiUrlTrade, recordPatternValue)
                                        console.log(recordPatternValue)
                                    } else {
                                        recordPattern[key] = []
                                    }
                                })
                                .catch(function (error) {
                                    console.log(error.response.data);
                                    console.log("Error:" + error.response.data)
                                    Telegram.sendMessage('Error: ' + error.response.data)
                                });


                        } catch (e) {
                            Telegram.sendMessage('Error: ' + e.toString())
                        }

                    }
                }
            }
        }

    });
}
