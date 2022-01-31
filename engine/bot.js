const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const coins = require('../utility/coins');
const Logger = require('../models/logger');
const Bot = require('../models/bot');
const Pattern = require('../pattern/triangle')
const Telegram = require('../utility/telegram');
const Strategy = require('../strategy/strategy');
const express = require('express')
const cors = require('cors')

const app = express();
app.use(cors());

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

mongoose.connect(process.env.URI_MONGODB);

let keyDbModel = '';
let timeFrame = [];

if (process.env.DEBUG === 'true') {
    keyDbModel = 'bot_development';
    timeFrame = [
        '1m',
    ]
}

if (process.env.DEBUG === 'false') {

    keyDbModel = 'bot_production';
    timeFrame = [
        '5m',
        '15m',
        '1h',
        '4h',
    ]
}


let tradeEnabled = false;
let coinsArray = coins.getCoins()
let emaArray = {}

let tokenArray = {}
let exchangeInfoArray = {}

let indexArray = {}
let recordPattern = {}
let exclusionList = {}
let entryCoins = {}

let takeProfitArray = {}
let stopLossArray = {}
let entryArray = {}


let balance = 3000
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;


app.get('/info', (req, res) => {
    let obj = {
        'balance': balance,
        'sizeTrade': sizeTrade,
        'uptime': 0,
    }
    res.send(obj);
});


app.get('/trade/entry', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.entryArray);
});

app.get('/trade/takeprofit', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.takeProfitArray);
});

app.get('/trade/stoploss', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.stopLossArray);
});

app.get('/tokenArray', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.tokenArray);
});

app.get('/exchangeInfoArray', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.exchangeInfoArray);
});

app.get('/getExclusionList', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.exclusionList);
});

app.get('/getEntryCoins', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.entryCoins);
});

app.get('/getRecordPattern', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.recordPattern);
});


function takeProfit(key, close, recordPatternValue, symbol, interval) {

    let entryprice = recordPatternValue['entryprice']
    let entrypricedate = recordPatternValue['entrypricedate']
    let takeprofit = recordPatternValue['takeprofit']
    let strategy = recordPatternValue['strategy']

    if (close >= takeprofit) {

        let finaleTradeValue;

        let takeProfitPercentage = (takeprofit - entryprice) / entryprice
        let finaleSizeTrade = (sizeTrade / entryprice) * takeprofit;

        takeProfitPercentage = _.round(takeProfitPercentage * 100, 2)
        totalPercentage += takeProfitPercentage

        finaleTradeValue = finaleSizeTrade - sizeTrade

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)


        let takeprofitObj = {
            type: 'TAKEPROFIT',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            takeprofitvalue: takeprofit,
            takeprofitpercentage: takeProfitPercentage,
            takeprofitdate: new Date(),
            hh: recordPatternValue['hh'],
            ll: recordPatternValue['ll'],
            lh: recordPatternValue['lh'],
            hl: recordPatternValue['hl'],
            strategy: strategy
        }

        const logger = new Logger(takeprofitObj)

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        takeProfitArray[key] = takeprofitObj
        recordPattern[key] = null;
        exclusionList[key] = true;

        let message = "TAKEPROFIT: " + symbol + "\n" +
            "Interval: " + interval + "\n" +
            "Takeprofit percentage: " + takeProfitPercentage + "%" + "\n" +
            "Balance: " + newBalance + "\n" +
            "Entry Price: " + entryprice + "\n" +
            "Entry date: " + entrypricedate.toUTCString() + "\n" +
            "hh: " + recordPatternValue['hh'] + "\n" +
            "ll: " + recordPatternValue['ll'] + "\n" +
            "lh: " + recordPatternValue['lh'] + "\n" +
            "hl: " + recordPatternValue['hl']

        Telegram.sendMessage(message)

        return true;
    }

    return false;
}


async function downloadCandlestick(token, time, candle, key) {

    return new Promise(function (resolve, reject) {

        binance.candlesticks(token, time, (error, ticks, token) => {

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


function stopLoss(key, close, recordPatternValue, symbol, interval) {

    let entryprice = recordPatternValue['entryprice']
    let entrypricedate = recordPatternValue['entrypricedate']
    let stoploss = recordPatternValue['stoploss']
    let strategy = recordPatternValue['strategy']

    // Stop Loss
    if (close <= stoploss) {

        let finaleTradeValue;
        let stopLossPercentage = (stoploss - entryprice) / entryprice
        stopLossPercentage = _.round(stopLossPercentage * 100, 2)
        let finaleSizeTrade = (sizeTrade / entryprice) * stoploss;
        finaleTradeValue = finaleSizeTrade - sizeTrade
        totalPercentage += stopLossPercentage

        sumSizeTrade += finaleTradeValue;
        let newBalance = _.round(balance + sumSizeTrade, 2)

        let stopLossObj = {
            type: 'STOPLOSS',
            symbol: symbol,
            interval: interval,
            balance: newBalance,
            entryprice: entryprice,
            entrypricedate: entrypricedate,
            stoplossvalue: stoploss,
            stoplosspercentage: stopLossPercentage,
            stoplossdate: new Date(),
            hh: recordPatternValue['hh'],
            ll: recordPatternValue['ll'],
            lh: recordPatternValue['lh'],
            hl: recordPatternValue['hl'],
            strategy: strategy
        }

        const logger = new Logger(stopLossObj)

        logger.save().then((result) => {
            console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        stopLossArray[key] = stopLossObj
        recordPattern[key] = null;

        let message = "STOPLOSS: " + symbol + "\n" +
            "Interval: " + interval + "\n" +
            "Stop loss percentage: " + stopLossPercentage + "%" + "\n" +
            "Balance: " + newBalance + "\n" +
            "Entry Price: " + entryprice + "\n" +
            "Entry date: " + entrypricedate.toUTCString() + "\n" +
            "hh: " + recordPatternValue['hh'] + "\n" +
            "ll: " + recordPatternValue['ll'] + "\n" +
            "lh: " + recordPatternValue['lh'] + "\n" +
            "hl: " + recordPatternValue['hl']

        Telegram.sendMessage(message)

        return true;
    }

    return false;
}

async function calculateEMA(token, time, candle, period) {
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
                let ema = EMA.calculate({period: period, values: closeArray})
                resolve(_.last(ema))
            }

        }, {limit: candle});

    });
}

async function exchangeInfo() {

    return new Promise(async function (resolve, reject) {

        binance.exchangeInfo(async function (error, data) {

                if (error !== null) reject(error);

                for (let obj of data.symbols) {

                    if (coinsArray.indexOf(obj.symbol) !== -1) {
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

                const dbData = await Bot.findOne({name: keyDbModel});
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
                    emaArray = dbData.emaArray;
                    balance = dbData.balance;

                } else {

                    for (let time of timeFrame) {
                        for (const token of coinsArray) {

                            let key = token + "_" + time

                            // downloadCandlestick(token, time, 250, key).then( () => {
                            //     console.log("Downloaded candlesticj  " + key)
                            // }).catch(
                            //     function (error) {
                            //         console.log("Error: Can't download candlestick: " + error)
                            //     }
                            // )

                            exclusionList[key] = false;
                            indexArray[key] = -1;
                            tokenArray[key] = [];
                            entryCoins[key] = false;

                            recordPattern[key] = null;
                            takeProfitArray[key] = null;
                            stopLossArray[key] = null;
                            entryArray[key] = null;
                            emaArray[key] = null;
                        }
                    }

                    await Bot.create({
                        name: keyDbModel,
                        exchangeInfoArray: exchangeInfoArray,
                        tokenArray: tokenArray,
                        indexArray: indexArray,
                        recordPattern: recordPattern,
                        exclusionList: exclusionList,
                        entryCoins: entryCoins,
                        takeProfitArray: takeProfitArray,
                        stopLossArray: stopLossArray,
                        entryArray: entryArray,
                        emaArray: emaArray,
                        balance: balance,
                    })
                }

                resolve()
            }
        );

    });
}

async function engine() {

    for (let time of timeFrame) {

        let startMessage = 'Bot Pattern Analysis System Started for interval: ' + time
        Telegram.sendMessage(startMessage)

        binance.websockets.candlesticks(coinsArray, time, async (candlesticks) => {

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

            // check in real time - takeprofit and stoploss
            if (recordPattern[key] !== null) {

                let recordPatternValue = recordPattern[key];
                if (recordPatternValue['confirmed'] === true) {

                    let stoploss = stopLoss(key, currentClose, recordPatternValue, symbol, interval)
                    let takeprofit = takeProfit(key, currentClose, recordPatternValue, symbol, interval)

                    if (stoploss || takeprofit) {

                        await Bot.findOneAndUpdate({name: keyDbModel},
                            {
                                recordPattern: recordPattern,
                                exclusionList: exclusionList,
                                stopLossArray: stopLossArray,
                                takeProfitArray: takeProfitArray,
                                balance: balance
                            });

                        if (tradeEnabled) {
                            binance.balance((error, balances) => {
                                if (error) return console.error(error);
                                console.log(exchangeInfoArray[symbol])
                                let sellAmount = binance.roundStep(balances[symbol].available, exchangeInfoArray[symbol].stepSize);
                                binance.marketSell(symbol, sellAmount);
                            });
                        }
                    }

                }
            }

            // Check at close tick
            if (isFinal) {

                if (exclusionList[key] === true) {

                    let dataValue = new Date();
                    let hour = dataValue.getUTCHours();
                    let minutes = dataValue.getUTCMinutes();

                    // if midnight and zero minutes then unlock pair
                    if (hour === 0 && minutes === 0) {
                        exclusionList[key] = false;
                    }

                }

                // if pair is not excluded for take profit and pair is not entered in position
                if (exclusionList[key] === false && entryCoins[key] === false) {

                    // emaArray[key].shift();
                    // emaArray[key].push(parseFloat(close))
                    // let ema = EMA.calculate({period: 200, values: emaArray[key]})
                    // console.log("CALCULATE EMA for: " + key + " value: " + parseFloat(_.last(ema)))

                    calculateEMA(symbol, interval, 250, 200).then(function (ema) {

                        if (currentClose < ema) {
                            recordPattern[key] = null;
                            indexArray[key] = -1;
                            tokenArray[key] = [];
                        }

                        if (currentClose > ema) {

                            console.log("SCANNING... ema below close price: " + symbol + " - " + interval + " - EMA200: " + _.round(ema, 4) + " - Close: " + currentClose)

                            // Cerco il pattern per la n-esima pair se il prezzo è sopra l'ema
                            if (recordPattern[key] == null) {

                                indexArray[key] += 1

                                let ticker = {
                                    'index': parseInt(indexArray[key]),
                                    'symbol': symbol.toString(),
                                    'open': parseFloat(open),
                                    'close': parseFloat(close),
                                    'low': parseFloat(low),
                                    'high': parseFloat(high),
                                    'interval': interval.toString(),
                                    'time': new Date()
                                }

                                tokenArray[key].push(ticker)
                                let pattern = Pattern.patternMatching(tokenArray[key], symbol)

                                if (!_.isEmpty(pattern)) {

                                    recordPattern[key] = {
                                        'symbol': symbol,
                                        'interval': interval,
                                        'hh': pattern['hh'],
                                        'll': pattern['ll'],
                                        'lh': pattern['lh'],
                                        'hl': pattern['hl'],
                                        'hh_close': pattern['hh_close'],
                                        'll_open': pattern['ll_open'],
                                        'll_low': pattern['ll_low'],
                                        'll_close': pattern['ll_close'],
                                        'lh_close': pattern['lh_close'],
                                        'hl_open': pattern['hl_open'],
                                        'hh_high': pattern['hh_high'],
                                        'confirmed': false
                                    }

                                    tokenArray[key] = [];
                                    indexArray[key] = -1
                                }
                            }


                            // Se il pattern esiste provo a confermarlo sempre se il prezzo è sopra l'ema
                            if (recordPattern[key] != null) {

                                let recordPatternValue = recordPattern[key];
                                if (recordPatternValue['confirmed'] === false) {

                                    if (low < recordPatternValue['ll'] || currentClose > recordPatternValue['hh']) {
                                        recordPattern[key] = null;
                                    } else {

                                        let isStrategyBreakoutFound = Strategy.strategyBreakout(symbol, interval, currentClose, recordPatternValue)

                                        if (isStrategyBreakoutFound) {


                                            if (tradeEnabled) {
                                                //console.log(exchangeInfoArray[symbol])
                                                let buyAmount = binance.roundStep(sizeTrade / currentClose, exchangeInfoArray[symbol].stepSize);
                                                binance.marketBuy(symbol, buyAmount);
                                            }

                                            // set entry in array with key
                                            entryCoins[key] = true;
                                            // store entry
                                            entryArray[key] = recordPatternValue

                                        }
                                        console.log(recordPatternValue)
                                    }
                                }
                            }

                        }

                    }).catch(
                        (error) => {
                            recordPattern[key] = null;
                            indexArray[key] = -1;
                            tokenArray[key] = [];
                            console.log("Error: Can't calculate EMA for symbol rest engine for: " + error)
                        }
                    ).finally(
                        async () => {
                            await Bot.findOneAndUpdate({name: keyDbModel},
                                {
                                    recordPattern: recordPattern,
                                    indexArray: indexArray,
                                    tokenArray: tokenArray,
                                    entryArray: entryArray,
                                    entryCoins: entryCoins
                                });
                        }
                    ) // end calculate ema
                }
            }
        });
    }
}


(async () => {

    try {

        // Esistono già i dati allora li precarico
        exchangeInfo().then(() => {
            engine();
        })

    } catch (e) {
        console.log(e)
    }

})();






