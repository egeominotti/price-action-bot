const Binance = require('node-binance-api');
const redis = require("redis");
const client = redis.createClient();

const binance = new Binance();

const coins = [
    'ENJUSDT',
    'SANDUSDT',
    'MANAUSDT',
    'AXSUSDT',
    'ALICEUSDT',
    'DARUSDT',
    'MBOXUSDT',
    'TLMUSDT'
];

let indexArray = {};
for (const token of coins) {
    indexArray[token] = -1;
}

binance.websockets.candlesticks(coins, "1m", (candlesticks) => {
    let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
    let {
        o: open,
        h: high,
        l: low,
        c: close,
        v: volume,
        n: trades,
        i: interval,
        x: isFinal,
        q: quoteVolume,
        V: buyVolume,
        Q: quoteBuyVolume
    } = ticks;

    // - Controlla il Ticker sempre a chiusura
    if (isFinal) {

        indexArray[symbol] += 1

        let ticker = {
            'index': indexArray[symbol],
            'symbol': symbol,
            'open': parseFloat(open),
            'close': parseFloat(close),
            'low': parseFloat(low),
            'high': parseFloat(high),
            'volume': volume,
            'interval': interval,
            'time': new Date().toString()
        }

        client.sadd(symbol, JSON.stringify(ticker));
        console.log(indexArray)
    }
});
