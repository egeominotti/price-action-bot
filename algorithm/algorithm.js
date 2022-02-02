const _ = require("lodash");
const Pattern = require("../pattern/triangle");
const Strategy = require("../strategy/strategy");
const Telegram = require("../utility/telegram");
const Bot = require("../models/bot");
const Indicators = require('../indicators/ema');
let tokenArray = {}
let exchangeInfoArray = {}
let emaArray = {}

let indexArray = {}
let recordPattern = {}
let exclusionList = {}
let entryCoins = {}

let takeProfitArray = {}
let stopLossArray = {}
let entryArray = {}


function queue(key, currentClose, symbol, interval, keyDbModel) {

    if (exclusionList[key] === true) {

        let dataValue = new Date();
        let hour = dataValue.getUTCHours();
        let minutes = dataValue.getUTCMinutes();

        // if midnight and zero minutes then unlock pair
        if (hour === 0 && minutes === 0) {
            exclusionList[key] = false;
        }

    }

    if (exclusionList[key] === false && entryCoins[key] === false) {

         Indicators.ema(key, currentClose, symbol, interval, 200, 200, emaArray).then((ema) => {

            if (currentClose < ema) {
                recordPattern[key] = null;
                indexArray[key] = -1;
                tokenArray[key] = [];
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
                                    let buyAmount = binance.roundStep(sizeTrade / currentClose, exchangeInfoArray[symbol].stepSize);
                                    binance.marketBuy(symbol, buyAmount);
                                }

                                entryCoins[key] = true;
                                // store entry
                                entryArray[key] = recordPatternValue

                                if (telegramEnabled) {
                                    let message = "ENTRY: " + symbol + "\n" +
                                        "Interval: " + interval + "\n" +
                                        "Entryprice: " + currentClose + "\n" +
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
                await Bot.findOneAndUpdate({name: keyDbModel},
                    {
                        recordPattern: recordPattern,
                        indexArray: indexArray,
                        tokenArray: tokenArray,
                        entryArray: entryArray,
                        entryCoins: entryCoins
                    });
            }
        )
    }

}
