const _ = require("lodash");
const Pattern = require("../pattern/triangle");
const Strategy = require("../strategy/strategy");
const Telegram = require("../utility/telegram");
const Indicators = require('../indicators/ema');
const Logger = require("../models/logger");
const Binance = require("node-binance-api");

let emaArray = {};

function entry(symbol, interval, close, recordPatternValue, telegramEnabled) {

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

function checkFloating(key, symbol, close) {

    let position = sizeTrade / entryArray[key]['entryprice'];
    let floatingPosition = position * parseFloat(close);
    let floatingtrade = floatingPosition - sizeTrade;
    let floatingtradeperc = ((floatingPosition - sizeTrade) / sizeTrade) * 100

    floatingArr[key] = floatingtrade;
    floatingPercArr[key] = floatingtradeperc;

    console.log('---------------- Calculate Floating -------------------- ');
    console.log("Pair... " + symbol)
    console.log("Floating Percentage... " + _.round(floatingtradeperc, 2) + " %")
    console.log("Floating Profit/Loss... " + _.round(floatingtrade, 2) + "$")
    console.log('-------------------------------------------------------------- ');

    totalFloatingValue = 0;
    totalFloatingPercValue = 0;
    totalFloatingBalance = 0;

    for (let time of timeFrame) {
        for (const token of finder) {
            let keyFloating = token + "_" + time
            if (!isNaN(floatingArr[keyFloating]) && !isNaN(floatingPercArr[keyFloating])) {
                totalFloatingValue += floatingArr[keyFloating];
                totalFloatingPercValue += floatingPercArr[keyFloating];
            }
        }
    }

    totalFloatingBalance = balance + totalFloatingValue;

    let message = "Global Statistics Profit/Loss" + "\n" +
        "--------------------------------------------------------------------" + "\n" +
        "Total Floating Balance: " + _.round(totalFloatingBalance, 2) + " $" + "\n" +
        "Total Floating Percentage: " + _.round(totalFloatingPercValue, 2) + " %" + "\n" +
        "Total Floating Profit/Loss: " + _.round(totalFloatingValue, 2) + " $"

    console.log(message)
}

function takeProfit(obj) {

    let close = obj.close;
    let key = obj.key;
    let symbol = obj.symbol;
    let interval = obj.interval;

    let recordPatternValue = recordPattern[key];

    let entryprice = recordPatternValue['entryprice']
    let entrypricedate = recordPatternValue['entrypricedate']
    let takeprofit = recordPatternValue['takeprofit']
    let strategy = recordPatternValue['strategy']

    if (close >= takeprofit) {

        let finaleTradeValue;

        let takeProfitPercentage = (takeprofit - entryprice) / entryprice
        let finaleSizeTrade = (sizeTrade / entryprice) * takeprofit;

        takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)
        obj.totalPercentage += takeProfitPercentage

        finaleTradeValue = finaleSizeTrade - sizeTrade

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)
        obj.variableBalance = newBalance

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
            hh: recordPatternValue['hh'],
            ll: recordPatternValue['ll'],
            lh: recordPatternValue['lh'],
            hl: recordPatternValue['hl'],
            strategy: strategy
        }

        const logger = new Logger(takeprofitObj)

        logger.save().then((result) => {
            //console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        if (telegramEnabled) {
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
        }

        takeProfitArray = takeprofitObj
        exclusionList[key] = true;

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
    let exclusionList = obj.exclusionList;
    let sumSizeTrade = obj.sumSizeTrade;
    let sizeTrade = obj.sizeTrade;

    let recordPatternValue = recordPattern[key];

    let entryprice = recordPatternValue['entryprice']
    let entrypricedate = recordPatternValue['entrypricedate']
    let stoploss = recordPatternValue['stoploss']
    let strategy = recordPatternValue['strategy']

    if (close <= stoploss) {

        let finaleTradeValue;
        let stopLossPercentage = (stoploss - entryprice) / entryprice
        stopLossPercentage = _.round(stopLossPercentage * 100, 2)
        let finaleSizeTrade = (sizeTrade / entryprice) * stoploss;
        finaleTradeValue = finaleSizeTrade - sizeTrade
        obj.totalPercentage += stopLossPercentage

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)
        obj.variableBalance = newBalance

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
            hh: recordPatternValue['hh'],
            ll: recordPatternValue['ll'],
            lh: recordPatternValue['lh'],
            hl: recordPatternValue['hl'],
            strategy: strategy
        }

        const logger = new Logger(stopLossObj)

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        if (telegramEnabled) {
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
        }

        stopLossArray = stopLossObj
        obj.recordPattern[key] = null;
        exclusionList[key] = true;

        return true;
    }

    return false;
}


function checkExit(obj) {

    let key = obj.key;
    let symbol = obj.symbol;

    if (recordPattern[key] !== null) {

        let recordPatternValue = recordPattern[key];
        if (recordPatternValue['confirmed'] === true) {

            let stoploss = stopLoss(key)
            let takeprofit = takeProfit(key)

            if (stoploss || takeprofit) {

                if (tradeEnabled) {

                    try {

                        const userBinance = new Binance().options({
                            APIKEY: '46AQQyECQ8V56kJcyUSTjrDNPz59zRS6J50qP1UVq95hkqBqMYjBS8Kxg8xumQOI',
                            APISECRET: 'DKsyTKQ6UueotZ7d9FlXNDJAx1hSzT8V09G58BGgA85O6SVhlE1STWLWwEMEFFYa',
                        });

                        userBinance.balance((error, balances) => {
                            if (error) return console.error(error);
                            let sellAmount = userBinance.roundStep(balances[symbol].available, exchangeInfoArray[symbol].stepSize);
                            userBinance.marketSell(symbol, sellAmount);
                        });

                    } catch (e) {
                        console.log(e);
                    }
                }

                entryArray[key] = null;
                recordPattern[key] = null;
                entryCoins[key] = false;
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
    let key = obj.key;
    let close = obj.close;
    let open = obj.open;
    let low = obj.low;
    let high = obj.high;
    let symbol = obj.symbol;
    let interval = obj.interval;

    Indicators.ema(close, symbol, interval, 200, 300, emaArray).then((ema) => {

        if (!isNaN(ema)) {

            if (close < ema) {

                recordPattern[key] = null;
                indexArray[key] = -1;
                tokenArray[key] = [];

                return false;
            }

            if (close > ema) {

                console.log("SCANNER... ema below close price: " + symbol + " - " + interval + " - EMA200: " + _.round(ema, 4) + " - Close: " + close)

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

                                    try {

                                        const userBinance = new Binance().options({
                                            APIKEY: '46AQQyECQ8V56kJcyUSTjrDNPz59zRS6J50qP1UVq95hkqBqMYjBS8Kxg8xumQOI',
                                            APISECRET: 'DKsyTKQ6UueotZ7d9FlXNDJAx1hSzT8V09G58BGgA85O6SVhlE1STWLWwEMEFFYa',
                                        });

                                        let buyAmount = userBinance.roundStep(sizeTrade / close, exchangeInfoArray[symbol].stepSize);
                                        userBinance.marketBuy(symbol, buyAmount);

                                    } catch (err) {
                                        console.log(err)
                                    }
                                }

                                totalEntry += 1;
                                console.log(totalEntry)
                                entryCoins[key] = true;
                                entryArray[key] = recordPatternValue

                                entry(symbol, interval, close, recordPatternValue, telegramEnabled);


                            }
                        }
                    }
                }
            }
        }
    }).catch((e) => {
        console.log(e)
    });


}


module.exports = {
    checkEntry,
    checkExit,
    stopLoss,
    takeProfit,
    checkFloating
}
