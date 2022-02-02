const Binance = require('node-binance-api');
const express = require('express')
const cors = require('cors')
const _ = require("lodash");
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');

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

let tokenArray = {}
let exchangeInfoArray = {}
let emaArray = {}

let indexArray = {}
let recordPattern = {}
let exclusionList = {}
let entryCoins = {}

let takeProfitArray = {}
let stopLossArray = {}
let entryArray = {}
let telegramEnabled = true;
let tradeEnabled = false;

let balance = 3000
let variableBalance = 0;
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;

let emaDaily = {}
let dbKey = 'prova';


let obj = {
    //Settings
    'balance': balance,
    'sizeTrade': sizeTrade,
    'variableBalance': variableBalance,
    'totalPercentage': totalPercentage,
    'sumSizeTrade': sumSizeTrade,
    'telegramEnabled': telegramEnabled,
    'tradeEnabled': tradeEnabled,
    // Array Global
    'exclusionList': exclusionList,
    'recordPattern': recordPattern,
    'indexArray': indexArray,
    'tokenArray': tokenArray,
    'entryCoins': entryCoins,
    'takeProfitArray': takeProfitArray,
    'stopLossArray': stopLossArray,
    'entryArray': entryArray,
    'exchangeInfoArray': exchangeInfoArray,
    //Info DB
    'dbKey': dbKey,
}

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

                            obj['symbol'] = symbol;
                            obj['key'] = key;
                            obj['interval'] = interval;
                            obj['close'] = parseFloat(close);
                            obj['high'] = parseFloat(high);
                            obj['open'] = parseFloat(open);
                            obj['low'] = parseFloat(low);

                            Algorithms.queue(obj)
                        }

                    }).catch((err) => {
                        console.log(err)
                    })
                }
            }
        });
    }
});
