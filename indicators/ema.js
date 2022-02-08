const {EMA} = require("technicalindicators");
const _ = require("lodash");

/**
 *
 * @param token
 * @param time
 * @param periodEma
 * @param limitCandle
 * @returns {Promise<unknown>}
 */
async function emaWithoutCache(token, time, periodEma, limitCandle) {
    return new Promise(function (resolve, reject) {

        binance.candlesticks(token, time, (error, ticks, symbol) => {

            if (error !== null) reject(error)
            if (_.isEmpty(ticks)) reject(error)

            if (!_.isEmpty(ticks)) {
                let closeArray = [];
                for (let t of ticks) {
                    let [time, open, high, low, close, ignored] = t;
                    closeArray.push(parseFloat(close));
                }
                closeArray.pop()

                let ema = EMA.calculate({period: periodEma, values: closeArray})
                resolve(_.last(ema))
            }

        }, {limit: limitCandle});
    });
}


/**
 *
 * @param close
 * @param token
 * @param time
 * @param periodEma
 * @param limitCandle
 * @returns {Promise<unknown>}
 */
async function ema(close, token, time, periodEma, limitCandle) {
    return new Promise(function (resolve, reject) {

        let key = token + "_" + time

        if (emaArray[key] !== undefined) {

            if (close !== undefined) {
                emaArray[key].shift();
                emaArray[key].push(parseFloat(close))
            }

            let ema = EMA.calculate({period: periodEma, values: emaArray[key]})
            resolve(_.last(ema))

        } else {

            binance.candlesticks(token, time, (error, ticks, symbol) => {

                if (error !== null) reject(error)
                if (_.isEmpty(ticks)) reject(error)

                if (!_.isEmpty(ticks)) {
                    let closeArray = [];
                    for (let t of ticks) {
                        let [time, open, high, low, close, ignored] = t;
                        closeArray.push(parseFloat(close));
                    }
                    closeArray.pop()
                    emaArray[key] = closeArray

                    let ema = EMA.calculate({period: periodEma, values: closeArray})
                    resolve(_.last(ema))
                }

            }, {limit: limitCandle});
        }

    });
}

module.exports = {
    ema,
    emaWithoutCache
}
