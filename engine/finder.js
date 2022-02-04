const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Exchange = require("../exchange/binance");
const redis = require('redis');

const client = redis.createClient();
client.connect();

client.flushAll('ASYNC');
client.on('error', (err) => {
    console.log(err)
    console.log('Error occured while connecting or accessing redis server');
});

Exchange.exchangeInfo().then(async (listPair) => {

    new Binance().websockets.candlesticks(listPair, '1m', async (candlesticks) => {
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

        if (isFinal) {

            Indicators.emaWithoutCache(symbol, '1d', 5, 150)

                .then(async (ema) => {

                    if (currentClose > ema) {
                        let obj = JSON.stringify({'ema': ema, 'pair': symbol})
                        await client.set(symbol, obj);
                    }
                    return false;

                }).catch(() => {
            })
        }
    });


}).catch((err) => {
    console.log(err)
});

