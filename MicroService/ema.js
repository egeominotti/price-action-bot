const Binance = require('node-binance-api');
const coins = require('../utility/coins');
const express = require('express')

const app = express();
const port = 3000;

app.listen(port, () => console.log(`TAS bot app listening on port ${port}!`))

const _ = require("lodash");
const EMA = require('technicalindicators').EMA

const binance = new Binance().options({
    useServerTime: true,
    recvWindow: 60000, // Set a higher recvWindow to increase response timeout
    verbose: true, // Add extra output when subscribing to WebSockets, etc
    log: log => {
        console.log(log); // You can create your own logger here, or disable console output
    }
});

require('dotenv').config();


let coinsArray = coins.getCoins()
let emaArray = {}


let timeFrame = [
    '1m',
    '5m',
    '15m',
    '1h',
    '4h'
]

// example: http://0.0.0.0:3000/ema/200/FLUXUSDT_5m
app.get('/ema/:period/:key', (req, res) => {
    let period = req.params.period;
    let key = req.params.key;
    let ema = EMA.calculate({period: period, values: emaArray[key]})
    let lastEma = _.last(ema)
    let obj = {
        'ema': parseFloat(lastEma)
    }
    res.send(obj);
});


async function calculateEMA(token, time, candle, key) {

    return new Promise(function (resolve, reject) {

        binance.candlesticks(token, time, (error, ticks, symbol) => {

            let closeArray = [];
            if (error !== null) reject()

            if (!_.isEmpty(ticks)) {

                for (let t of ticks) {
                    let [time, open, high, low, close, ignored] = t;
                    closeArray.push(parseFloat(close));
                }
                closeArray.pop()
                emaArray[key] = closeArray
            }

        }, {limit: candle});

    });
}

async function websockets() {

    for (let time of timeFrame) {

        binance.websockets.candlesticks(coinsArray, time, (candlesticks) => {

            let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
            let {
                o: open,
                h: high,
                l: low,
                c: close,
                i: interval,
                x: isFinal,
            } = ticks;

            let key = symbol + "_" + interval

            // Check at close tick
            if (isFinal) {

                emaArray[key].shift();
                emaArray[key].push(parseFloat(close))

                let ema = EMA.calculate({period: 200, values: emaArray[key]})
                console.log("CALCULATE EMA for: " + key + " value: " + parseFloat(_.last(ema)))
            }

        });
    }
}


(async () => {

    try {

        for (let time of timeFrame) {
            for (const token of coinsArray) {

                let key = token + "_" + time
                calculateEMA(token, time, 250, key).then(function (ema) {
                }).catch(
                    function (error) {
                        console.log("Error: Can't calculate EMA for symbol rest engine for: " + error)
                    }
                )
            }
        }

        await websockets();

    } catch (e) {
        console.log(e)
    }

})();






