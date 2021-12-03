const Binance = require('node-binance-api');
const Pattern = require('../pattern/triangle');
const axios = require('axios').default;
const coins = require('../utility/coins');
const fs = require('fs');
const _ = require("lodash");
const binance = new Binance();

let coinsArray = coins.getCoins()

let timeFrame = [
    '5m',
    '15m',
    '30m',
    '1h',
    '4h',
    '8h',
    '1D',
    '3D',
    '1W',
    '1M',
]

let ticksArray = []
let patternData = undefined
let patternDataArray = []


for (let tt of timeFrame) {

    binance.candlesticks('ETHUSDT', tt, (error, ticks, symbol) => {

        if (!_.isEmpty(ticks)) {

            let index = 0;
            for (let t of ticks) {
                let [time, open, high, low, close, ignored] = t;

                let ticker = {
                    'index': index,
                    'symbol': symbol.toString(),
                    'open': parseFloat(open),
                    'close': parseFloat(close),
                    'low': parseFloat(low),
                    'high': parseFloat(high),
                    'time': time,
                }

                index++;
                ticksArray.push(ticker)
                let pattern = Pattern.patternMatching(ticksArray, symbol)
                if (!_.isEmpty(pattern)) {
                    patternData = pattern
                    ticksArray = []
                    index = 0;
                }

                if (patternData !== undefined) {

                    if (low < patternData['ll'] || close > patternData['hh']) {
                        patternData = undefined;

                    } else {

                        if (close > patternData['lh']) {

                            patternData['symbol'] = symbol;
                            patternData['timeframe'] = tt
                            patternData['date'] = new Date(time).toUTCString();
                            patternDataArray.push(patternData)

                            fs.writeFileSync("backtest/backtest.json", JSON.stringify(patternDataArray, null, 4), function (err) {
                            });

                            patternData = undefined;
                        }
                    }
                }

            }
        }

    }, {limit: 1000});
}


