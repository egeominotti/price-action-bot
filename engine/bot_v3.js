const Binance = require('node-binance-api');
const express = require('express')
const cors = require('cors')
const _ = require("lodash");
const Indicators = require('../indicators/ema');

const app = express();
app.use(cors());
const port = 3000;
app.listen(port)


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
    '1d',
];

let emaDaily = {}

binance.prevDay(false, async (error, prevDay) => {

    if (error) return console.log(error.body);

    let markets = [];

    for (let obj of prevDay) {
        let symbol = obj.symbol;
        if (!symbol.endsWith('USDT')) continue;
        markets.push(obj.symbol);
    }

    for (const time of timeFrame) {

        binance.websockets.candlesticks(markets, time, (candlesticks) => {
            let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
            let {
                o: open,
                h: high,
                l: low,
                c: close,
                i: interval,
                x: isFinal,
            } = ticks;

            let currentClose = parseFloat(close)
            let key = symbol + "_" + interval

            if (isFinal) {

                if (interval === '5m') {

                    Indicators.ema(currentClose, symbol, interval, 5, 100, emaDaily).then((ema) => {

                        if (currentClose > ema) {
                            console.log(symbol)
                        }

                    }).catch((err) => {
                        console.log(err)
                    })
                }
            }
        });
    }
});
