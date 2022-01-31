const Telegram = require('../utility/telegram');

/**
 *
 * @param symbol
 * @param interval
 * @param close
 * @param record
 * @returns {boolean}
 */
function strategyBreakout(symbol, interval, close, record) {

    /*
    let hh_close = record['hh_close']
    let hh_high = record['hh_high']
    let ll_open = record['ll_open']
    let ll_close = record['ll_close']
    let ll_low = record['ll_low']
    let lh_close = record['lh_close']
    let hl_open = record['hl_open']
    let takeprofit = (lh_close + hh_high) - ll_low;
    */

    let hh = record['hh']
    let ll = record['ll']
    let lh = record['lh']
    let hl = record['hl']

    let stoploss = ll;
    let takeprofit = (close - stoploss) * 2 + close;

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
