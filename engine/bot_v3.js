const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const Telegram = require("../utility/telegram");
const Exchange = require("../exchange/binance");
const mongoose = require("mongoose");


mongoose.connect(process.env.URI_MONGODB);

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

let telegramEnabled = true;
let tradeEnabled = false;

let balance = 3000
let variableBalance = 0;
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;

let tokenArray = {}
let exchangeInfoArray = {}
let emaDaily = {}
let indexArray = {}
let recordPattern = {}
let exclusionList = {}
let entryCoins = {}
let takeProfitArray = {}
let stopLossArray = {}
let entryArray = {}


let dbKey = 'prova';


let obj = {

    'binance': binance,
    //Settings
    'balance': balance,
    'sizeTrade': sizeTrade,
    'variableBalance': variableBalance,
    'totalPercentage': totalPercentage,
    'sumSizeTrade': sumSizeTrade,
    'telegramEnabled': telegramEnabled,
    'tradeEnabled': tradeEnabled,
    // Array Global
    'timeFrame': timeFrame,
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


Exchange.exchangeInfo(obj).then(async () => {

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

                let key = symbol + "_" + interval

                obj['symbol'] = symbol;
                obj['key'] = key;
                obj['interval'] = interval;
                obj['close'] = parseFloat(close);
                obj['high'] = parseFloat(high);
                obj['open'] = parseFloat(open);
                obj['low'] = parseFloat(low);

                if (entryArray[key] !== null) {
                    Algorithms.checkExit(obj)
                }

                if (isFinal) {

                    Indicators.ema(parseFloat(close), symbol, interval, 5, 100, emaDaily).then((ema) => {

                        if (entryArray[key] === null) {

                            if (parseFloat(close) > ema) {

                                obj['symbol'] = symbol;
                                obj['key'] = key;
                                obj['interval'] = interval;
                                obj['close'] = parseFloat(close);
                                obj['high'] = parseFloat(high);
                                obj['open'] = parseFloat(open);
                                obj['low'] = parseFloat(low);

                                Algorithms.checkEntry(obj)
                            }
                        }

                    }).catch((err) => {
                        console.log(err)
                    })
                }
            });
        }
    });


}).catch((err) => {
    console.log(err)
});

