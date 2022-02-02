const Binance = require('node-binance-api');
const express = require('express')
const cors = require('cors')
const _ = require("lodash");
const {EMA} = require("technicalindicators");
const Pattern = require("../pattern/triangle");
const Strategy = require("../strategy/strategy");
const Telegram = require("../utility/telegram");
const Bot = require("../models/bot");

const app = express();
app.use(cors());
const port = 3000;
app.listen(port)

global.ticker = {};
const binance = new Binance().options({
    useServerTime: true,
    verbose: true, // Add extra output when subscribing to WebSockets, etc
    log: log => {
        console.log(log); // You can create your own logger here, or disable console output
    }
});

let timeFrame = [
    '5m',
    '15m',
    '1h',
    '4h',
];

let emaDaily = {}

async function calculateEMADaily(key, close, token, time, candle, period) {
    return new Promise(function (resolve, reject) {

        // TODO: da ricontrollare
        if (emaDaily[key] !== undefined) {
            emaDaily[key].pop();
            emaDaily[key].push(parseFloat(close))
            let ema = EMA.calculate({period: period, values: emaDaily[key]})
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
                    emaDaily[key] = closeArray
                    let ema = EMA.calculate({period: period, values: closeArray})
                    resolve(_.last(ema))
                }

            }, {limit: candle});
        }

    });
}

binance.prevDay(false, (error, prevDay) => {
    if (error) return console.log(error.body);

    let markets = [];

    for (let obj of prevDay) {
        let symbol = obj.symbol;
        if (!symbol.endsWith('USDT')) continue;
        //console.log(`${symbol} price: ${obj.lastPrice} volume: ${obj.volume} change: ${obj.priceChangePercent}%`);
        global.ticker[symbol] = obj.lastPrice;
        markets.push(symbol);
    }

    for (const time of timeFrame) {
        binance.websockets.candlesticks(markets, time, (candlesticks) => {
            let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
            let {
                o: open,
                h: high,
                l: low,
                c: close,
                v: volume,
                i: interval,
                x: isFinal,
            } = ticks;

            let currentClose = parseFloat(close)
            let key = symbol + "_" + interval

            if (isFinal) {

                calculateEMADaily(key, currentClose, symbol, interval, 100, 5).then((ema) => {

                    if (currentClose > ema) {
                        console.log(symbol)
                    }

                }).catch((err) => {
                    console.log(err)
                })
            }

            //
            // console.info(symbol + " " + interval + " candlestick update");
            // console.info("open: " + open);
            // console.info("high: " + high);
            // console.info("low: " + low);
            // console.info("close: " + close);
            // console.info("volume: " + volume);
            // console.info("isFinal: " + isFinal);
        });
    }
});
