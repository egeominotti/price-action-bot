const Binance = require('node-binance-api');
const logic = require('./logic');
const coins = require('./coins');
const _ = require("lodash");
const binance = new Binance();

const args = process.argv;
let timeFrame = args[2]

let tokenArray = {}
let indexArray = {};
for (const token of coins.getCoins()) {
    indexArray[token] = -1;
    tokenArray[token] = [];
}


binance.websockets.candlesticks(coins.getCoins(), timeFrame, (candlesticks) => {

    let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
    let {
        o: open,
        h: high,
        l: low,
        c: close,
        i: interval,
        x: isFinal,
    } = ticks;

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

        console.log(interval)
        console.log(tokenArray[symbol])
        tokenArray[symbol].push(ticker)

        let pattern = logic.patternMatching(tokenArray[symbol])
        if (!_.isEmpty(pattern)) {

            console.log("Pattern found: " + symbol)
            console.log(pattern)

            tokenArray[symbol] = [];
            indexArray[symbol] = -1

            let message = 'Pattern found pair: ' + symbol + "\n" +
                'Pattern Found Time: ' + pattern['patternFoundTime'] + "\n" +
                "entryPrice: " + pattern['entryPrice'] + "\n" +
                "stopLoss:: " + pattern['stopLoss'] + "\n" +
                "min: " + pattern['min'] + "\n" +
                "max: " + pattern['max'] + "\n" +

                "HH open: " + pattern['HH']['tick']['open'] + "\n" +
                "HH high: " + pattern['HH']['tick']['high'] + "\n" +
                "HH low: " + pattern['HH']['tick']['low'] + "\n" +
                "HH close: " + pattern['HH']['tick']['close'] + "\n" +
                "HH time: " + pattern['HH']['tick']['time'] + "\n" +

                "LL open: " + pattern['LL']['tick']['open'] + "\n" +
                "LL high: " + pattern['LL']['tick']['high'] + "\n" +
                "LL low: " + pattern['LL']['tick']['low'] + "\n" +
                "LL close: " + pattern['LL']['tick']['close'] + "\n" +
                "LL time: " + pattern['LL']['tick']['time'] + "\n" +

                "LH open: " + pattern['LH']['tick']['open'] + "\n" +
                "LH high: " + pattern['LH']['tick']['high'] + "\n" +
                "LH low: " + pattern['LH']['tick']['low'] + "\n" +
                "LH close: " + pattern['LH']['tick']['close'] + "\n" +
                "LH time: " + pattern['LH']['tick']['time'] + "\n" +

                "HL open: " + pattern['HL']['tick']['open'] + "\n" +
                "HL high: " + pattern['HL']['tick']['high'] + "\n" +
                "HL low: " + pattern['HL']['tick']['low'] + "\n" +
                "HL close: " + pattern['HL']['tick']['close'] + "\n" +
                "HL time: " + pattern['HL']['tick']['time']

            logic.sendMessageTelegram(message)

        } else {
            console.log("Running for found pattern | HH | LL | LH | HL .... " + symbol)
        }

    }
});



