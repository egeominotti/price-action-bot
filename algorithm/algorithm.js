const _ = require("lodash");
const Pattern = require("../pattern/triangle");
const Strategy = require("../strategy/strategy");
const Telegram = require("../utility/telegram");
const Bot = require("../models/bot");
const Indicators = require('../indicators/ema');
const Logger = require("../models/logger");

let emaArray = {};

function takeProfit(obj) {

    let close = obj.close;
    let key = obj.key;
    let symbol = obj.symbol;
    let interval = obj.interval;
    let exclusionList = obj.exclusionList;
    let recordPattern = obj.recordPattern;
    let balance = obj.balance;
    let takeProfitArray = obj.takeProfitArray;
    let telegramEnabled = obj.telegramEnabled;
    let sumSizeTrade = obj.sumSizeTrade;
    let sizeTrade = obj.sizeTrade;
    let totalPercentage = obj.totalPercentage;
    let variableBalance = obj.variableBalance;

    let entryprice = recordPattern['entryprice']
    let entrypricedate = recordPattern['entrypricedate']
    let takeprofit = recordPattern['takeprofit']
    let strategy = recordPattern['strategy']

    if (close >= takeprofit) {

        let finaleTradeValue;

        let takeProfitPercentage = (takeprofit - entryprice) / entryprice
        let finaleSizeTrade = (sizeTrade / entryprice) * takeprofit;

        takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)
        totalPercentage += takeProfitPercentage

        finaleTradeValue = finaleSizeTrade - sizeTrade

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)

        // update variable balance
        variableBalance = newBalance

        let takeprofitObj = {
            type: 'TAKEPROFIT',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            takeprofitvalue: takeprofit,
            takeprofitpercentage: takeProfitPercentage,
            takeprofitdate: new Date(),
            hh: recordPattern['hh'],
            ll: recordPattern['ll'],
            lh: recordPattern['lh'],
            hl: recordPattern['hl'],
            strategy: strategy
        }

        const logger = new Logger(takeprofitObj)

        logger.save().then((result) => {
            //console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        takeProfitArray[key] = takeprofitObj
        // se fa take profit escludo il pair fino a mezzanotte
        exclusionList[key] = true;

        if (telegramEnabled) {
            let message = "TAKEPROFIT: " + symbol + "\n" +
                "Interval: " + interval + "\n" +
                "Takeprofit percentage: " + takeProfitPercentage + "%" + "\n" +
                "Balance: " + newBalance + "\n" +
                "Entry Price: " + entryprice + "\n" +
                "Entry date: " + entrypricedate.toUTCString() + "\n" +
                "hh: " + recordPattern['hh'] + "\n" +
                "ll: " + recordPattern['ll'] + "\n" +
                "lh: " + recordPattern['lh'] + "\n" +
                "hl: " + recordPattern['hl']

            Telegram.sendMessage(message)
        }

        return true;
    }

    return false;
}


function forceSell(obj) {

    let close = obj.close;
    let key = obj.key;
    let symbol = obj.symbol;
    let interval = obj.interval;
    let recordPattern = obj.recordPattern;
    let balance = obj.balance;
    let stopLossArray = obj.stopLossArray;
    let telegramEnabled = obj.telegramEnabled;
    let variableBalance = obj.variableBalance;
    let sumSizeTrade = obj.sumSizeTrade;
    let sizeTrade = obj.sizeTrade;
    let totalPercentage = obj.totalPercentage;

    let entryprice = recordPattern['entryprice']
    let entrypricedate = recordPattern['entrypricedate']
    let stoploss = recordPattern['stoploss']
    let strategy = recordPattern['strategy']

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

        // update variable balance
        variableBalance = newBalance

        let stopLossObj = {
            type: 'FORCE_SELL',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            stoplossvalue: stoploss,
            stoplosspercentage: stopLossPercentage,
            stoplossdate: new Date(),
            hh: recordPattern['hh'],
            ll: recordPattern['ll'],
            lh: recordPattern['lh'],
            hl: recordPattern['hl'],
            strategy: strategy
        }

        const logger = new Logger(stopLossObj)

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        stopLossArray[key] = stopLossObj
        recordPattern[key] = null;

        if (telegramEnabled) {
            let message = "TRAILING STOPLOSS|TAKEPROFIT: " + symbol + "\n" +
                "Interval: " + interval + "\n" +
                "Stop loss percentage: " + stopLossPercentage + "%" + "\n" +
                "Balance: " + newBalance + "\n" +
                "Entry Price: " + entryprice + "\n" +
                "Entry date: " + entrypricedate.toUTCString() + "\n" +
                "hh: " + recordPattern['hh'] + "\n" +
                "ll: " + recordPattern['ll'] + "\n" +
                "lh: " + recordPattern['lh'] + "\n" +
                "hl: " + recordPattern['hl']

            Telegram.sendMessage(message)
        }

        return true;
    }

    return false;
}



function stopLoss(obj) {

    let close = obj.close;
    let key = obj.key;
    let symbol = obj.symbol;
    let interval = obj.interval;
    let recordPattern = obj.recordPattern;
    let balance = obj.balance;
    let stopLossArray = obj.stopLossArray;
    let telegramEnabled = obj.telegramEnabled;
    let variableBalance = obj.variableBalance;
    let sumSizeTrade = obj.sumSizeTrade;
    let sizeTrade = obj.sizeTrade;
    let totalPercentage = obj.totalPercentage;

    let entryprice = recordPattern['entryprice']
    let entrypricedate = recordPattern['entrypricedate']
    let stoploss = recordPattern['stoploss']
    let strategy = recordPattern['strategy']

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

        // update variable balance
        variableBalance = newBalance

        let stopLossObj = {
            type: 'STOPLOSS',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            stoplossvalue: stoploss,
            stoplosspercentage: stopLossPercentage,
            stoplossdate: new Date(),
            hh: recordPattern['hh'],
            ll: recordPattern['ll'],
            lh: recordPattern['lh'],
            hl: recordPattern['hl'],
            strategy: strategy
        }

        const logger = new Logger(stopLossObj)

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        stopLossArray[key] = stopLossObj
        recordPattern[key] = null;

        if (telegramEnabled) {
            let message = "STOPLOSS: " + symbol + "\n" +
                "Interval: " + interval + "\n" +
                "Stop loss percentage: " + stopLossPercentage + "%" + "\n" +
                "Balance: " + newBalance + "\n" +
                "Entry Price: " + entryprice + "\n" +
                "Entry date: " + entrypricedate.toUTCString() + "\n" +
                "hh: " + recordPattern['hh'] + "\n" +
                "ll: " + recordPattern['ll'] + "\n" +
                "lh: " + recordPattern['lh'] + "\n" +
                "hl: " + recordPattern['hl']

            Telegram.sendMessage(message)
        }

        return true;
    }

    return false;
}


async function checkExit(obj) {

    let key = obj.key;
    let binance = obj.binance;
    let symbol = obj.symbol;
    let exclusionList = obj.exclusionList;
    let recordPattern = obj.recordPattern;
    let exchangeInfoArray = obj.exchangeInfoArray;
    let entryArray = obj.entryArray;
    let tradeEnabled = obj.tradeEnabled;
    let stopLossArray = obj.stopLossArray;
    let takeProfitArray = obj.takeProfitArray;
    let entryCoins = obj.entryCoins;
    let dbKey = obj.dbKey;


    // check in real time - takeprofit and stoploss
    if (recordPattern[key] !== null) {

        let recordPatternValue = recordPattern[key];
        if (recordPatternValue['confirmed'] === true) {

            let stoploss = stopLoss(obj)
            let takeprofit = takeProfit(obj)

            if (stoploss || takeprofit) {

                if (tradeEnabled) {
                    binance.balance((error, balances) => {
                        if (error) return console.error(error);
                        //console.log(exchangeInfoArray[symbol])
                        let sellAmount = binance.roundStep(balances[symbol].available, exchangeInfoArray[symbol].stepSize);
                        binance.marketSell(symbol, sellAmount);
                    });
                }

                entryArray[key] = null;
                recordPattern[key] = null;
                entryCoins[key] = false;

                // await Bot.findOneAndUpdate({name: dbKey},
                //     {
                //         recordPattern: recordPattern,
                //         exclusionList: exclusionList,
                //         entryArray: entryArray,
                //         entryCoins: entryCoins,
                //         stopLossArray: stopLossArray,
                //         takeProfitArray: takeProfitArray,
                //     });
            }

        }
    }
}

/**
 *
 * @param obj
 */
function checkEntry(
    obj,
) {

    let close = obj.close;
    let open = obj.open;
    let low = obj.low;
    let high = obj.high;
    let key = obj.key;
    let binance = obj.binance;
    let symbol = obj.symbol;
    let interval = obj.interval;
    let exclusionList = obj.exclusionList;
    let indexArray = obj.indexArray;
    let recordPattern = obj.recordPattern;
    let tokenArray = obj.tokenArray;
    let sizeTrade = obj.sizeTrade;
    let exchangeInfoArray = obj.exchangeInfoArray;
    let entryArray = obj.entryArray;
    let tradeEnabled = obj.tradeEnabled;
    let telegramEnabled = obj.telegramEnabled;
    let entryCoins = obj.entryCoins;
    let dbKey = obj.dbKey;

    if (exclusionList[key] === false && entryCoins[key] === false) {

        Indicators.ema(close, symbol, interval, 200, 500, emaArray).then((ema) => {

            if (close < ema) {
                recordPattern[key] = null;
                indexArray[key] = -1;
                tokenArray[key] = [];
            }

            if (close > ema) {

                console.log("SCANNING... ema below close price: " + symbol + " - " + interval + " - EMA200: " + _.round(ema, 4) + " - Close: " + close)

                if (recordPattern[key] == null) {

                    indexArray[key] += 1

                    let ticker = {
                        'index': parseInt(indexArray[key]),
                        'symbol': symbol,
                        'open': open,
                        'close': close,
                        'low': low,
                        'high': high,
                        'interval': interval,
                        'time': new Date()
                    }

                    tokenArray[key].push(ticker)
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


                if (recordPattern[key] != null) {

                    let recordPatternValue = recordPattern[key];
                    if (recordPatternValue['confirmed'] === false) {

                        if (low < recordPatternValue['ll'] || close > recordPatternValue['hh']) {
                            recordPattern[key] = null;
                        } else {

                            let isStrategyBreakoutFound = Strategy.strategyBreakout(symbol, interval, close, recordPatternValue)

                            if (isStrategyBreakoutFound) {

                                if (tradeEnabled) {
                                    let buyAmount = binance.roundStep(sizeTrade / close, exchangeInfoArray[symbol].stepSize);
                                    binance.marketBuy(symbol, buyAmount);
                                }

                                entryCoins[key] = true;
                                entryArray[key] = recordPatternValue

                                console.log("--------------------------------------------------------------")
                                console.log("ENTRY FOUND... symbol - " + symbol + " timeframe - " + interval)
                                console.log("--------------------------------------------------------------")

                                if (telegramEnabled) {
                                    let message = "ENTRY: " + symbol + "\n" +
                                        "Interval: " + interval + "\n" +
                                        "Entryprice: " + close + "\n" +
                                        "Takeprofit: " + recordPatternValue['takeprofit'] + "\n" +
                                        "Stoploss:  " + recordPatternValue['stoploss'] + "\n" +
                                        "hh: " + recordPatternValue['hh'] + "\n" +
                                        "ll: " + recordPatternValue['ll'] + "\n" +
                                        "lh: " + recordPatternValue['lh'] + "\n" +
                                        "hl: " + recordPatternValue['hl'] + "\n" +
                                        "Date Entry: " + recordPatternValue['entrypricedate'].toUTCString()

                                    Telegram.sendMessage(message)
                                }
                            }
                        }
                    }
                }

            }

        }).catch(
            (error) => {

                recordPattern[key] = null;
                indexArray[key] = -1;
                tokenArray[key] = [];
                console.log("Error: Can't calculate EMA for symbol rest engine for: " + error)
            }
        ).finally(
            async () => {

                // await Bot.findOneAndUpdate({name: dbKey},
                //     {
                //         recordPattern: recordPattern,
                //         indexArray: indexArray,
                //         tokenArray: tokenArray,
                //         entryArray: entryArray,
                //         entryCoins: entryCoins
                //     });
            }
        )
    }

}

module.exports = {
    checkEntry,
    checkExit,
    stopLoss,
    takeProfit,
    forceSell
}
