const Binance = require('node-binance-api');
const redis = require("redis");
const logic = require('./logic');
const _ = require("lodash");
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

let tokenArray = {}
let indexArray = {};
for (const token of coins) {
    indexArray[token] = -1;
    tokenArray[token] = [];
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

                console.log(tokenArray)
                tokenArray[symbol].push(ticker)

                let pattern = logic.patternMatching(tokenArray[symbol])
                if (!_.isEmpty(pattern)) {

                    console.log("Pattern found: " + symbol)
                    console.log(pattern)

                    tokenArray[symbol] = {}
                    indexArray[symbol] = -1

                    let message = 'Pattern found pair: ' + symbol + "\n" +
                        'Pattern Found Time: ' + pattern['patternFoundTime'] + "\n" +
                        "entryPrice: " + pattern['entryPrice'] + "\n" +
                        "stopLoss:: " + pattern['stopLoss'] + "\n" +
                        "min: " + pattern['min'] + "\n" +
                        "max: " + pattern['max'] + "\n" +
                        "HH: " + pattern['HH']['tick']['time'] + "\n" +
                        "LL: " + pattern['LL']['tick']['time'] + "\n" +
                        "LH: " + pattern['LH']['tick']['time'] + "\n" +
                        "HL: " + pattern['HL']['tick']['time']

                    console.log(message)
                    logic.sendMessageTelegram(message)

                } else {
                    console.log("----------------")
                    console.log("Running for found HH | LL | LH | HL | .... " + symbol)
                    console.log("----------------")
                }

            }
        });
    }
});



