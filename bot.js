const Binance = require('node-binance-api');
const logic = require('./logic');
const axios = require('axios').default;
const coins = require('./coins');
const fs = require('fs');
const _ = require("lodash");
const binance = new Binance();
const args = process.argv;

//let coins = []
let timeFrame = args[2]
let coinsArray = coins.getCoins()
let tokenArray = {}
let indexArray = {};
let recordPattern = {}
let tradeEnabled = false;
let apiUrlTrade = 'https://r2h3kkfk3a.execute-api.eu-south-1.amazonaws.com/api/tradingbotpriceaction';

// Balace start of 5000 dollars
let balance = 5000

let startMessage = 'Bot Pattern Analysis System Started for interval: ' + timeFrame
logic.sendMessageTelegram(startMessage)

console.log(coinsArray)
for (const token of coinsArray) {
    console.log(token)
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
        v: volume,
        n: trades,
        i: interval,
        x: isFinal,
        q: quoteVolume,
        V: buyVolume,
        Q: quoteBuyVolume
    } = ticks;

    let nameFile = 'data/pattern_' + interval + ".json";

    if (!_.isEmpty(recordPattern[symbol])) {
        const recordPatternValue = _.head(recordPattern[symbol]);
        if (recordPatternValue['confirmed'] === true) {

            let entryprice = recordPatternValue['entryprice']
            let takeprofit = recordPatternValue['takeprofit']
            let stoploss = recordPatternValue['stoploss']

            // Stop Loss
            if (close <= stoploss) {

                let stopLossPercentage = (stoploss - entryprice) / entryprice
                let stopLossValue = stoploss - entryprice
                stopLossPercentage = _.round(stopLossPercentage * 100, 2)

                balance = balance + stopLossValue

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
                recordPattern[symbol] = []

            }

            // TAKE PROFIT
            if (close >= takeprofit) {

                let takeProfitPercentage = (takeprofit - entryprice) / entryprice
                let takeProfitValue = takeprofit - entryprice

                takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)
                balance = balance + takeProfitValue

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

                fs.writeFile(nameFile, JSON.stringify(recordPattern, null, 4), {flag: 'wx'}, function (err) {
                });

            }

        } else {

            const recordPatternValue = _.head(recordPattern[symbol]);
            console.log(recordPatternValue);

            if (recordPatternValue['confirmed'] === false) {

                if (low < recordPatternValue['ll'] || close > recordPatternValue['hh']) {
                    recordPattern[symbol] = []
                } else {

                    if (close > recordPatternValue['lh']) {

                        let message = "Symbol: " + symbol + "\n" +
                            "Interval: " + interval + "\n" +
                            "Entry found at: " + new Date().toISOString() + "\n" +
                            "takeprofit: " + recordPatternValue['takeprofit'] + "\n" +
                            "stoploss:  " + recordPatternValue['stoploss'] + "\n" +
                            "hh: " + recordPatternValue['hh'] + "\n" +
                            "ll: " + recordPatternValue['ll'] + "\n" +
                            "lh: " + recordPatternValue['lh'] + "\n" +
                            "hl: " + recordPatternValue['hl']

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

                        logic.sendMessageTelegram(message)
                        recordPatternValue['confirmed'] = true
                        recordPatternValue['entryprice'] = close
                        recordPatternValue['entryData'] = new Date().toString()

                    }
                }
            }

        }
    }

});
