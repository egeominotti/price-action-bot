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
 * @param record
 */
function strategyBreakout(symbol, interval, close, record) {

    // HH high
    let hh = record['hh']
    // LL low
    let ll = record['ll']
    let lh = record['lh']
    let hl = record['hl']
    let hh_close = record['hh_close']
    let hh_high = record['hh_high']
    let ll_open = record['ll_open']
    let ll_close = record['ll_close']
    let ll_low = record['ll_low']
    let lh_close = record['lh_close']
    let hl_open = record['hl_open']

    let takeprofit = (lh_close + hh_high) - ll_low;
    let stoploss = 0;

    let ratioEntry = 0
    let ratioStopLoss = 0;
    let ratioTakeProfit = 0;

    if (interval === '1m') {

        ratioEntry = 1
        ratioTakeProfit = 1
        ratioStopLoss = 1

        stoploss = ll * ratioStopLoss;

    } else if (interval === '5m') {

        ratioEntry = 1.0020
        ratioTakeProfit = 0.9985
        ratioStopLoss = 1.001

        stoploss = ll * ratioStopLoss;

    } else if (interval === '15m') {

        ratioEntry = 1.0025
        ratioTakeProfit = 0.9985
        ratioStopLoss = 1.003

        stoploss = ll * ratioStopLoss;

    } else if (interval === '1h') {

        ratioEntry = 1.008
        ratioTakeProfit = 1
        ratioStopLoss = 1.015

        stoploss = hl * ratioStopLoss;

    } else if (interval === '4h') {

        ratioEntry = 1.01
        ratioTakeProfit = 0.985
        ratioStopLoss = 1.015

        stoploss = hl * ratioStopLoss;
    }

    if (close > lh) {

        let entrypricedate = new Date()
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

        return true;
    }

}

module.exports = {
    strategyBreakout
}
