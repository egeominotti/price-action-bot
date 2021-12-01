const axios = require("axios");
const Telegram = require('../utility/telegram');

/**
 *
 * StrategyBreakout
 * StrategyRetest
 * BuyOnHigherLow
 *
 */

/**
 *
 * @param symbol
 * @param interval
 * @param close
 * @param tradeEnabled
 * @param apiUrlTrade
 * @param recordPatternValue
 */
function strategyBreakout(symbol, interval, close, tradeEnabled, apiUrlTrade, recordPatternValue) {

    let hh = recordPatternValue['hh']
    let ll = recordPatternValue['ll']
    let lh = recordPatternValue['lh']
    let hl = recordPatternValue['hl']

    let takeprofit = 0;
    let stoploss = 0;
    let ratioEntry = 0
    let ratioStopLoss = 0;
    let ratioTakeProfit = 0;

    if (interval === '1m') {

        ratioEntry = 1
        ratioTakeProfit = 1
        ratioStopLoss = 1

        takeprofit = (lh['value'] + (hh['value'] - ll['value'])) * ratioTakeProfit;
        stoploss = ll['value'] * ratioStopLoss;

    } else if (interval === '5m') {

        ratioEntry = 1.0020
        ratioTakeProfit = 0.9985
        ratioStopLoss = 1.001

        takeprofit = (lh['value'] + (hh['value'] - ll['value'])) * ratioTakeProfit;
        stoploss = ll['value'] * ratioStopLoss;

    } else if (interval === '15m') {

        ratioEntry = 1.0025
        ratioTakeProfit = 0.9985
        ratioStopLoss = 1.003

        takeprofit = (lh['value'] + (hh['value'] - ll['value'])) * ratioTakeProfit;
        stoploss = ll['value'] * ratioStopLoss;

    } else if (interval === '45m') {

        ratioEntry = 1.0025
        ratioTakeProfit = 1
        ratioStopLoss = 1

        takeprofit = (lh['value'] + (hh['value'] - ll['value'])) * ratioTakeProfit;
        stoploss = ll['value'] * ratioStopLoss;

    } else if (interval === '1h') {

        ratioEntry = 1.008
        ratioTakeProfit = 1
        ratioStopLoss = 1.015

        takeprofit = (lh['value'] + (hh['value'] - ll['value'])) * ratioTakeProfit;
        stoploss = hl['value'] * ratioStopLoss;

    } else if (interval === '4h') {

        ratioEntry = 1.01
        ratioTakeProfit = 0.985
        ratioStopLoss = 1.015

        takeprofit = (lh['value'] + (hh['value'] - ll['value'])) * ratioTakeProfit;
        stoploss = hl['value'] * ratioStopLoss;
    }


    if (close > recordPatternValue['lh'] * ratioEntry) {

        // const fib = fibonacci.fibonacciRetrecement({
        //     levels: {
        //         0: recordPatternValue['hh'],
        //         1: recordPatternValue['ll']
        //     }
        // })
        // console.log(fib)

        let entrypricedate = new Date()

        if (tradeEnabled) {

            let body = {
                action: 'BUY',
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

        let message = "ENTRY: " + symbol + "\n" +
            "Interval: " + interval + "\n" +
            "Entry found at: " + entrypricedate.toUTCString() + "\n" +
            "takeprofit: " + takeprofit + "\n" +
            "stoploss:  " + stoploss + "\n" +
            "hh: " + hh + "\n" +
            "ll: " + ll + "\n" +
            "lh: " + lh + "\n" +
            "hl: " + hl

        Telegram.sendMessage(message)

        recordPatternValue['confirmed'] = true
        recordPatternValue['entryprice'] = close
        recordPatternValue['entrypricedate'] = entrypricedate
        recordPatternValue['takeprofit'] = takeprofit
        recordPatternValue['stoploss'] = stoploss
        recordPatternValue['strategy'] = 'breakout'
    }

}

module.exports = {
    strategyBreakout
}
