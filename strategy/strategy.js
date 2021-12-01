const axios = require("axios");
const Telegram = require('../utility/telegram');

/**
 *
 * @param symbol
 * @param interval
 * @param close
 * @param isTelegramEnabled
 * @param tradeEnabled
 * @param apiUrlTrade
 * @param recordPatternValue
 */
function strategyBreakout(symbol, interval, close, tradeEnabled, apiUrlTrade, recordPatternValue) {

    let takeprofit =    recordPatternValue['takeprofit']
    let stoploss =      recordPatternValue['stoploss']
    let hh =            recordPatternValue['hh']
    let ll =            recordPatternValue['ll']
    let lh =            recordPatternValue['lh']
    let hl =            recordPatternValue['hl']

    if (close > recordPatternValue['lh'] * 1.0023) {


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
        recordPatternValue['entryprice'] = closeIncreased
        recordPatternValue['entrypricedate'] = entrypricedate
        recordPatternValue['strategy'] = 'breakout'

    }

}

module.exports = {
    strategyBreakout
}
