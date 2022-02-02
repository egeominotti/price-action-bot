const Binance = require('node-binance-api');
const express = require('express')
const cors = require('cors')
const _ = require("lodash");
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const {EMA} = require("technicalindicators");
const Bot = require("../models/bot");
const Telegram = require("../utility/telegram");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
const port = 3000;
app.listen(port)

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

let telegramEnabled = true;
let tradeEnabled = false;

let balance = 3000
let variableBalance = 0;
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;


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

function exchangeInfoFull() {

    return new Promise(async function (resolve, reject) {

        binance.exchangeInfo(async function (error, data) {

                if (error !== null) reject(error);

                for (let obj of data.symbols) {

                    if (obj.status === 'TRADING' && obj.quoteAsset === 'USDT') {
                        let filters = {status: obj.status};
                        for (let filter of obj.filters) {
                            if (filter.filterType === "MIN_NOTIONAL") {
                                filters.minNotional = filter.minNotional;
                            } else if (filter.filterType === "PRICE_FILTER") {
                                filters.minPrice = filter.minPrice;
                                filters.maxPrice = filter.maxPrice;
                                filters.tickSize = filter.tickSize;
                            } else if (filter.filterType === "LOT_SIZE") {
                                filters.stepSize = filter.stepSize;
                                filters.minQty = filter.minQty;
                                filters.maxQty = filter.maxQty;
                            }
                        }
                        filters.baseAssetPrecision = obj.baseAssetPrecision;
                        filters.quoteAssetPrecision = obj.quoteAssetPrecision;
                        filters.icebergAllowed = obj.icebergAllowed;
                        exchangeInfoArray[obj.symbol] = filters;
                    }
                }

                const dbData = await Bot.findOne({name: dbKey});
                if (dbData !== null) {

                    tokenArray = dbData.tokenArray;
                    indexArray = dbData.indexArray;
                    exchangeInfoArray = dbData.exchangeInfoArray;
                    recordPattern = dbData.recordPattern;
                    exclusionList = dbData.exclusionList;
                    entryCoins = dbData.entryCoins;
                    takeProfitArray = dbData.takeProfitArray;
                    stopLossArray = dbData.stopLossArray;
                    entryArray = dbData.entryArray;

                } else {

                    for (let time of timeFrame) {
                        for (const token in exchangeInfoArray) {

                            let key = token + "_" + time

                            exclusionList[key] = false;
                            indexArray[key] = -1;
                            tokenArray[key] = [];
                            entryCoins[key] = false;
                            recordPattern[key] = null;
                            takeProfitArray[key] = null;
                            stopLossArray[key] = null;
                            entryArray[key] = null;
                        }
                    }

                    await Bot.create({
                        name: dbKey,
                        exchangeInfoArray: exchangeInfoArray,
                        tokenArray: tokenArray,
                        indexArray: indexArray,
                        recordPattern: recordPattern,
                        exclusionList: exclusionList,
                        entryCoins: entryCoins,
                        takeProfitArray: takeProfitArray,
                        stopLossArray: stopLossArray,
                        entryArray: entryArray,
                    })
                }

                // let startMessage = 'Multipattern Bot Pattern Analysis Engine System Started';
                // Telegram.sendMessage(startMessage)

                resolve()
            }
        );

    });
}


exchangeInfoFull().then(async () => {

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

                Algorithms.checkExit(obj)

                if (isFinal) {

                    if (interval === '5m') {

                        Indicators.ema(parseFloat(close), symbol, interval, 5, 100, emaDaily).then((ema) => {

                            if (parseFloat(close) > ema) {

                                console.log(symbol)

                                obj['close'] = parseFloat(close);
                                obj['high'] = parseFloat(high);
                                obj['open'] = parseFloat(open);
                                obj['low'] = parseFloat(low);

                                Algorithms.checkEntry(obj)
                            }

                        }).catch((err) => {
                            console.log(err)
                        })
                    }
                }
            });
        }
    });


}).catch(() => {
});

