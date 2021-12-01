// const mongoose = require('mongoose');
// const Binance = require('node-binance-api');
// const axios = require('axios').default;
// const coins = require('../utility/coins');
// const Logger = require('../models/logger');
// const Pattern = require('../pattern/triangle')
// const Telegram = require('../utility/telegram');
// const analysis = require('../analytics/analysis');
// const Old_bot = require('../models/bot');
// const Strategy = require('../strategy/strategy');
// const fibonacci = require('../indicators/fibonacci');
// const _ = require("lodash");
// const binance = new Binance();
// const args = process.argv;
//
// require('dotenv').config();
//
// mongoose.connect(process.env.URI_MONGODB);
//
//
// let timeFrame = args[2]
// let coinsArray = coins.getCoins()
// let tokenArray = {}
// let indexArray = {}
// let recordPattern = {}
//
// let apiUrlTrade = process.env.URI_API_TRADE;
// let balance = 5000
// let totalPercentage = 0
//
// let tradeEnabled = false;
// let isTelegramEnabled;
// if (process.env.DEBUG === 'false') {
//     isTelegramEnabled = true
// } else {
//     isTelegramEnabled = false
// }
//
//
// if (isTelegramEnabled) {
//     let startMessage = 'Bot Pattern Analysis System Started for interval: ' + timeFrame
//     Telegram.sendMessage(startMessage)
// }
//
// for (const token of coinsArray) {
//     indexArray[token] = -1;
//     tokenArray[token] = [];
//     recordPattern[token] = [];
// }
//
// // Send updated balance on instagram each 4 hours
// analysis.getBalance();
//
// binance.websockets.candlesticks(coinsArray, timeFrame, (candlesticks) => {
//
//     let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
//     let {
//         o: open,
//         h: high,
//         l: low,
//         c: close,
//         i: interval,
//         x: isFinal,
//     } = ticks;
//
//
//     let dataValue = new Date();
//     let hour = dataValue.getUTCHours();
//
//     if (hour >= 0 && hour <= 5) {
//
//         if (!_.isEmpty(recordPattern[symbol])) {
//             console.log("Non opero");
//             recordPattern[symbol] = []
//         }
//
//     } else {
//         if (!_.isEmpty(recordPattern[symbol])) {
//             const recordPatternValue = _.head(recordPattern[symbol]);
//             if (recordPatternValue['confirmed'] === true) {
//
//                 let entryprice = recordPatternValue['entryprice']
//                 let entrypricedate = recordPatternValue['entrypricedate']
//                 let takeprofit = recordPatternValue['takeprofit']
//                 let stoploss = recordPatternValue['stoploss']
//                 let strategy = recordPatternValue['strategy']
//
//                 // Stop Loss
//                 if (close <= stoploss) {
//
//                     let stopLossPercentage = (stoploss - entryprice) / entryprice
//                     stopLossPercentage = _.round(stopLossPercentage * 100, 2)
//
//                     totalPercentage += stopLossPercentage
//
//                     balance = _.round((balance / entryprice) * stoploss, 2)
//
//                     if (tradeEnabled) {
//
//                         let body = {
//                             action: 'SELL',
//                             exchange: 'BINANCE',
//                             ticker: symbol,
//                             asset: 'USDT',
//                         }
//
//                         axios.post(apiUrlTrade, body)
//                             .then(function (response) {
//                                 console.log(response);
//                             })
//                             .catch(function (error) {
//                                 console.log(error);
//                             });
//                     }
//
//                     const logger = new Logger({
//                         type: 'STOPLOSS',
//                         symbol: symbol,
//                         interval: interval,
//                         balance: balance,
//                         entryprice: entryprice,
//                         entrypricedate: entrypricedate,
//                         stoplossvalue: stoploss,
//                         stoplosspercentage: stopLossPercentage,
//                         stoplossdate: new Date(),
//                         hh: recordPatternValue['hh'],
//                         ll: recordPatternValue['ll'],
//                         lh: recordPatternValue['lh'],
//                         hl: recordPatternValue['hl'],
//                         strategy: strategy
//                     })
//
//                     logger.save().then((result) => {
//                         console.log(result)
//                     }).catch((err) => {
//                         console.log(err)
//                     });
//
//
//                     if (isTelegramEnabled) {
//
//                         let message = "Symbol: " + symbol + "\n" +
//                             "Interval: " + interval + "\n" +
//                             "Balance: " + balance + "\n" +
//                             "Entry date: " + entrypricedate.toUTCString() + "\n" +
//                             "Stop loss percentage: " + stopLossPercentage + "%" + "\n" +
//                             "hh: " + recordPatternValue['hh'] + "\n" +
//                             "ll: " + recordPatternValue['ll'] + "\n" +
//                             "lh: " + recordPatternValue['lh'] + "\n" +
//                             "hl: " + recordPatternValue['hl']
//
//                         Telegram.sendMessage(message)
//                     }
//                     recordPattern[symbol] = []
//                 }
//
//                 // TAKE PROFIT
//                 if (close >= takeprofit) {
//
//                     let takeProfitPercentage = (takeprofit - entryprice) / entryprice
//
//                     takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)
//
//                     totalPercentage += takeProfitPercentage
//
//                     balance = _.round((balance / entryprice) * takeprofit, 2)
//
//                     if (tradeEnabled) {
//
//                         let body = {
//                             action: 'SELL',
//                             exchange: 'BINANCE',
//                             ticker: symbol,
//                             asset: 'USDT',
//                         }
//
//                         axios.post(apiUrlTrade, body)
//                             .then(function (response) {
//                                 console.log(response);
//
//                             })
//                             .catch(function (error) {
//                                 console.log(error);
//                             });
//                     }
//
//                     const logger = new Logger({
//                         type: 'TAKEPROFIT',
//                         symbol: symbol,
//                         interval: interval,
//                         balance: balance,
//                         entryprice: entryprice,
//                         entrypricedate: entrypricedate,
//                         takeprofitvalue: takeprofit,
//                         takeprofitpercentage: takeProfitPercentage,
//                         takeprofitdate: new Date(),
//                         hh: recordPatternValue['hh'],
//                         ll: recordPatternValue['ll'],
//                         lh: recordPatternValue['lh'],
//                         hl: recordPatternValue['hl'],
//                         strategy: strategy
//                     })
//
//                     logger.save().then((result) => {
//                         console.log(result)
//                     }).catch((err) => {
//                         console.log(err)
//                     });
//
//                     if (isTelegramEnabled) {
//                         let message = "Symbol: " + symbol + "\n" +
//                             "Interval: " + interval + "\n" +
//                             "Balance: " + balance + "\n" +
//                             "Entry data: " + entrypricedate.toUTCString() + "\n" +
//                             "Takeprofit percentage: " + takeProfitPercentage + "%" + "\n" +
//                             "hh: " + recordPatternValue['hh'] + "\n" +
//                             "ll: " + recordPatternValue['ll'] + "\n" +
//                             "lh: " + recordPatternValue['lh'] + "\n" +
//                             "hl: " + recordPatternValue['hl']
//
//                         Telegram.sendMessage(message)
//                     }
//                     recordPattern[symbol] = []
//                 }
//
//             }
//         }
//
//         // Controllo alla chiusura della candela
//         if (isFinal) {
//
//             if (_.isEmpty(recordPattern[symbol])) {
//
//                 indexArray[symbol] += 1
//
//                 let ticker = {
//                     'index': parseInt(indexArray[symbol]),
//                     'symbol': symbol.toString(),
//                     'open': parseFloat(open),
//                     'close': parseFloat(close),
//                     'low': parseFloat(low),
//                     'high': parseFloat(high),
//                     'interval': interval.toString(),
//                     'time': new Date()
//                 }
//
//                 tokenArray[symbol].push(ticker)
//                 let pattern = Pattern.patternMatching(tokenArray[symbol], symbol)
//
//                 if (!_.isEmpty(pattern)) {
//
//                     let recordPatternData = {
//                         'symbol': symbol,
//                         'interval': interval,
//                         'entryprice': 0,
//                         'takeprofit': pattern['takeprofit'],
//                         'stoploss': pattern['stoploss'],
//                         'hh': pattern['hh'],
//                         'll': pattern['ll'],
//                         'lh': pattern['lh'],
//                         'hl': pattern['hl'],
//                         'confirmed': false,
//                         'entrypricedate': null,
//                         'strategy': ''
//                     }
//
//                     recordPattern[symbol].push(recordPatternData)
//                     tokenArray[symbol] = [];
//                     indexArray[symbol] = -1
//                 }
//
//             } else {
//
//                 const recordPatternValue = _.head(recordPattern[symbol]);
//                 console.log(recordPatternValue);
//
//                 if (recordPatternValue['confirmed'] === false) {
//
//                     if (low < recordPatternValue['ll'] || close > recordPatternValue['hh']) {
//                         recordPattern[symbol] = []
//                     } else {
//                         // Strategy - Breakout
//                         Strategy.strategyBreakout(symbol, interval, close, isTelegramEnabled, tradeEnabled, apiUrlTrade, recordPatternValue)
//                     }
//                 }
//
//             }
//         }
//     }
//
// });
