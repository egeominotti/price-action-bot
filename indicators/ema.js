const {EMA} = require("technicalindicators");
const _ = require("lodash");
const Binance = require("node-binance-api");


const binance = new Binance().options({
    verbose: true,
    log: log => {
        console.log(log);
    }
});

/**
 *
 * @param close
 * @param token
 * @param time
 * @param periodEma
 * @param limitCandle
 * @param arrayCache
 * @returns {Promise<unknown>}
 */
async function ema(close, token, time, periodEma, limitCandle, arrayCache) {
    return new Promise(function (resolve, reject) {

        let key = token + "_" + time

        if (arrayCache[key] !== undefined) {

            if (close !== undefined) {
                arrayCache[key].pop();
                arrayCache[key].push(parseFloat(close))
            }

            let ema = EMA.calculate({period: periodEma, values: arrayCache[key]})
            resolve(_.last(ema))

        } else {

            binance.candlesticks(token, time, (error, ticks, symbol) => {

                if (error !== null) reject(error)
                if (_.isEmpty(ticks)) reject(error)

                let closeArray = [];

                if (!_.isEmpty(ticks)) {

                    for (let t of ticks) {
                        let [time, open, high, low, close, ignored] = t;
                        closeArray.push(parseFloat(close));
                    }
                    closeArray.pop()
                    arrayCache[key] = closeArray

                    let ema = EMA.calculate({period: periodEma, values: closeArray})
                    resolve(_.last(ema))
                }

            }, {limit: limitCandle});
        }

    });
}

module.exports = {
    ema
}
