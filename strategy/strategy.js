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
 * @param record
 */
function strategyBreakout(symbol, interval, close, tradeEnabled, apiUrlTrade, record) {

    let hh = record['hh']
    let ll = record['ll']
    let lh = record['lh']
    let hl = record['hl']
    let hh_close = record['hh_close']
    let ll_open = record['ll_open']
    let lh_close = record['lh_close']
    let hl_open = record['hl_open']


    let takeprofit = 0;
    let stoploss = 0;

    let ratioEntry = 0
    let ratioStopLoss = 0;
    let ratioTakeProfit = 0;

    if (interval === '1m') {

        ratioEntry = 1
        ratioTakeProfit = 1
        ratioStopLoss = 1

        takeprofit = (lh_close + (hh_close - ll_open)) * ratioTakeProfit;
        stoploss = ll * ratioStopLoss;

    } else if (interval === '5m') {

        ratioEntry = 1.0020
        ratioTakeProfit = 0.9985
        ratioStopLoss = 1.001

        takeprofit = (lh_close + (hh_close - ll_open)) * ratioTakeProfit;
        stoploss = ll * ratioStopLoss;

    } else if (interval === '15m') {

        ratioEntry = 1.0025
        ratioTakeProfit = 0.9985
        ratioStopLoss = 1.003

        takeprofit = (lh_close + (hh_close - ll_open)) * ratioTakeProfit;
        stoploss = ll * ratioStopLoss;

    } else if (interval === '45m') {

        ratioEntry = 1.0025
        ratioTakeProfit = 1
        ratioStopLoss = 1

        takeprofit = (lh_close + (hh_close - ll_open)) * ratioTakeProfit;
        stoploss = ll * ratioStopLoss;

    } else if (interval === '1h') {

        ratioEntry = 1.008
        ratioTakeProfit = 1
        ratioStopLoss = 1.015

        takeprofit = (lh_close + (hh_close - ll_open)) * ratioTakeProfit;
        stoploss = hl * ratioStopLoss;

    } else if (interval === '4h') {

        ratioEntry = 1.01
        ratioTakeProfit = 0.985
        ratioStopLoss = 1.015

        takeprofit = (lh_close + (hh_close - ll_open)) * ratioTakeProfit;
        stoploss = hl * ratioStopLoss;
    }

    if (close > lh) {

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
            "Entryprice: " + close + "\n" +
            "Takeprofit: " + takeprofit + "\n" +
            "Stoploss:  " + stoploss + "\n" +
            "hh: " + hh + "\n" +
            "ll: " + ll + "\n" +
            "lh: " + lh + "\n" +
            "hl: " + hl + "\n" +
            "Date Entry: " + entrypricedate.toUTCString()

        Telegram.sendMessage(message)

        record['confirmed'] = true
        record['entryprice'] = close
        record['entrypricedate'] = entrypricedate
        record['takeprofit'] = takeprofit
        record['stoploss'] = stoploss
        record['strategy'] = 'breakout'
    }

}

module.exports = {
    strategyBreakout
}
