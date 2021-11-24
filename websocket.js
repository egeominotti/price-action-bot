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
    'TLMUSDT',
    'CROUSDT',
    'KDAUSDT',
    'DOTUSDT',
    'ETHUSDT',
    'BTCUSDT',
    'LUNAUSDT',
    'SOLUSDT',
    'AUDIOUSDT',
    'AVAXUSDT',
    'UNIUSDT',
    'MATICUSDT',
    'ADAUSDT',
    'EGLDUSDT',
    'ATOMUSDT',
    'FTMUSDT',
    'AAVEUSDT',
    'BNBUSDT',
    'VETUSDT',
    'FTTUSDT'
];

let indexArray = {};
for (const token of coins) {
    indexArray[token] = -1;
}

client.flushall((err, success) => {

    if (err) {
        throw new Error(err);
    }

    if (success) {
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
                    'index': parseInt(indexArray[symbol]),
                    'symbol': symbol.toString(),
                    'open': parseFloat(open),
                    'close': parseFloat(close),
                    'low': parseFloat(low),
                    'high': parseFloat(high),
                    'interval': interval.toString(),
                    'time': new Date()
                }
                client.zadd(symbol, indexArray[symbol], JSON.stringify(ticker));
                client.publish(symbol, {})
            }
        });
    }
});



