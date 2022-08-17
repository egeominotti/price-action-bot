const config = require('../config');
const _ = require("lodash");
const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const API = require("../api/api");
const schedule = require('node-schedule');
const {EMA} = require("technicalindicators");


(async () => {

    let exchangePair = Exchange.initData(await binance.exchangeInfo());
    console.log(exchangePair)
    let message = "Hi from HAL V2" + "\n" +
        "LOADED for scanning... " + exchangePair.length + " pair" + "\n"
    console.log(message)
    Telegram.sendMessage(message)

    for (let time of timeFrame) {

        binance.websockets.candlesticks(exchangePair, time, async (candlesticks) => {
            let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
            let {
                o: open,
                h: high,
                l: low,
                c: close,
                i: interval,
                x: isFinal,
            } = ticks;

            let key = symbol + "_" + interval;

            if (entryArray[key] !== null &&
                recordPattern[key] !== null &&
                recordPattern[key]['confirmed'] === true
            ) {

                let obj = {
                    'symbol': symbol,
                    'key': key,
                    'recordPattern': recordPattern[key],
                    'interval': interval,
                    'close': parseFloat(close),
                    'high': parseFloat(high),
                    'open': parseFloat(open),
                    'low': parseFloat(low)
                }

                Algorithms.checkFloating(obj);
                Algorithms.checkExit(obj);
            }

            if (isFinal) {

                if (emaArray[key] !== undefined) {
                    emaArray[key].shift();
                    emaArray[key].push(parseFloat(close))

                } else {

                    binance.candlesticks(symbol, time, (error, ticks, symbol) => {
                        if (!_.isEmpty(ticks)) {
                            let closeArray = [];
                            for (let t of ticks) {
                                let [time, open, high, low, close, ignored] = t;
                                closeArray.push(parseFloat(close));
                            }
                            closeArray.pop()
                            emaArray[key] = closeArray
                        }

                    }, {limit: 500});
                }

                let currentClose = parseFloat(close);
                if (emaArray[key] !== undefined) {

                    let ema = _.last(EMA.calculate({period: 5, values: emaArray[key]}))

                    console.log(ema)
                    console.log(currentClose)

                    if (currentClose > ema) {
                        let obj = {
                            'symbol': symbol,
                            'key': key,
                            'interval': interval,
                            'close': parseFloat(close),
                            'high': parseFloat(high),
                            'open': parseFloat(open),
                            'low': parseFloat(low)
                        }
                        Algorithms.checkEntry(obj);
                    }
                }

            }

        });

    }

})();


