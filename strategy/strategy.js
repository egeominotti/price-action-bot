/**
 *
 * @param symbol
 * @param interval
 * @param close
 * @param record
 * @returns {boolean}
 */
function strategyBreakout(symbol, interval, close, record) {

    if (close > record['lh']) {

        let stoploss = record['ll'] * 0.99;
        let takeprofit = (close - stoploss) * 1.985 + close;

        record['confirmed'] = true
        record['entryprice'] = close
        record['entrypricedate'] = new Date()
        record['takeprofit'] = takeprofit
        record['stoploss'] = stoploss
        record['strategy'] = 'breakout'

        return true;
    }

    return false;
}

module.exports = {
    strategyBreakout
}
