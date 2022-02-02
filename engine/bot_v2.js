const mongoose = require('mongoose');
const Binance = require('node-binance-api');
const coins = require('../utility/coins');
const Logger = require('../models/logger');
const Bot = require('../models/bot');
const Pattern = require('../pattern/triangle')
const Telegram = require('../utility/telegram');
const Strategy = require('../strategy/strategy');
const express = require('express')
const schedule = require('node-schedule');


const cors = require('cors')

const app = express();
app.use(cors());

const port = 3000;
app.listen(port)

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
        '5m',
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

// management user
// let userAPI = [
//     {'nome': 'egeo', 'api_key': '', 'api_secret': ''},
//     {'nome': 'matteo', 'api_key': '', 'api_secret': ''},
//     {'nome': 'carlo', 'api_key': '', 'api_secret': ''},
// ]
//
// let arrObjectInstanceBinance = []
//
// for (let user in userAPI) {
//     const binance = new Binance().options({
//         API_KEY: user.api_key,
//         API_SECRET: user.api_secret,
//     });
//     arrObjectInstanceBinance.push(binance);
// }


let tradeEnabled = false;
let telegramEnabled = false;
let coinsArray = coins.getCoins()

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

let balance = 3000
let variableBalance = 0;
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;


app.get('/info', (req, res) => {
    let obj = {
        'balance': variableBalance,
        'sizeTrade': sizeTrade,
        'tradeEnabled': tradeEnabled,
        'telegramEnabled': telegramEnabled,
        'uptime': 0,
    }
    res.send(obj);
});

app.get('/trade/enableTrade', async (req, res) => {
    tradeEnabled = true;
    res.send({'trade': tradeEnabled});
});

app.get('/trade/disableTrade', async (req, res) => {
    tradeEnabled = false;
    res.send({'trade': tradeEnabled});
});

app.get('/notify/enableTelegram', async (req, res) => {
    telegramEnabled = true;
    res.send({'trade': telegramEnabled});
});

app.get('/trade/disableTelegram', async (req, res) => {
    telegramEnabled = false;
    res.send({'trade': telegramEnabled});
});

app.get('/trade/emergency', async (req, res) => {

    for (let time of timeFrame) {
        for (const token of coinsArray) {
            let key = token + "_" + time
            if (recordPattern[key] !== null) {
                if (tradeEnabled) {
                    for (let objBinance in arrObjectInstanceBinance) {
                        objBinance.balance((error, balances) => {
                            if (error) return console.error(error);
                            //console.log(exchangeInfoArray[token])
                            let sellAmount = binance.roundStep(balances[token].available, exchangeInfoArray[token].stepSize);
                            binance.marketSell(token, sellAmount);
                        });
                    }
                }
            }
        }
    }
    res.send({'stop_all': true});

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

        // update variable balance
        variableBalance = newBalance

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
            //console.log(result)
        }).catch((err) => {
            console.log(err)
        });

        takeProfitArray[key] = takeprofitObj
        // se fa take profit escludo il pair fino a mezzanotte
        exclusionList[key] = true;

        if (telegramEnabled) {
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
        }

        return true;
    }

    return false;
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

        // update variable balance
        variableBalance = newBalance

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

        if (telegramEnabled) {
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
        }

        return true;
    }

    return false;
}


async function calculateEMA(key, close, token, time, candle, period) {
    return new Promise(function (resolve, reject) {
        // fix it

        if (emaArray[key] !== null) {
            console.log("Calcolo ema dalla cache")
            emaArray[key].shift();
            emaArray[key].push(parseFloat(close))
            let ema = EMA.calculate({period: period, values: emaArray[key]})
            resolve(_.last(ema))

        } else {
            binance.candlesticks(token, time, (error, ticks, symbol) => {
                console.log("Scarico le candele")
                let closeArray = [];
                if (error !== null) reject()

                if (!_.isEmpty(ticks)) {

                    for (let t of ticks) {
                        let [time, open, high, low, close, ignored] = t;
                        closeArray.push(parseFloat(close));
                    }
                    closeArray.pop()
                    emaArray[key] = closeArray
                    let ema = EMA.calculate({period: period, values: closeArray})
                    resolve(_.last(ema))
                }

            }, {limit: candle});
        }

    });
}


async function engine(coin) {

    //let startMessage = 'Bot Pattern Analysis System Started';
    //Telegram.sendMessage(startMessage)

    for (let time of timeFrame) {

        binance.websockets.candlesticks(coin, time, async (candlesticks) => {

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

                        if (tradeEnabled) {
                            binance.balance((error, balances) => {
                                if (error) return console.error(error);
                                //console.log(exchangeInfoArray[symbol])
                                let sellAmount = binance.roundStep(balances[symbol].available, exchangeInfoArray[symbol].stepSize);
                                binance.marketSell(symbol, sellAmount);
                            });
                        }

                        entryArray[key] = null;
                        recordPattern[key] = null;
                        entryCoins[key] = false;

                        await Bot.findOneAndUpdate({name: keyDbModel},
                            {
                                recordPattern: recordPattern,
                                exclusionList: exclusionList,
                                entryArray: entryArray,
                                entryCoins: entryCoins,
                                stopLossArray: stopLossArray,
                                takeProfitArray: takeProfitArray,
                            });
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

                // Controlla se già è stato fatto un take profit, e che non c'e un entry in corso
                if (exclusionList[key] === false && entryCoins[key] === false) {

                    calculateEMA(key, currentClose, symbol, interval, 300, 200).then((ema) => {

                        console.log(ema)

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
                                                let buyAmount = binance.roundStep(sizeTrade / currentClose, exchangeInfoArray[symbol].stepSize);
                                                binance.marketBuy(symbol, buyAmount);
                                            }

                                            entryCoins[key] = true;
                                            // store entry
                                            entryArray[key] = recordPatternValue

                                            if (telegramEnabled) {
                                                let message = "ENTRY: " + symbol + "\n" +
                                                    "Interval: " + interval + "\n" +
                                                    "Entryprice: " + currentClose + "\n" +
                                                    "Takeprofit: " + recordPatternValue['takeprofit'] + "\n" +
                                                    "Stoploss:  " + recordPatternValue['stoploss'] + "\n" +
                                                    "hh: " + recordPatternValue['hh'] + "\n" +
                                                    "ll: " + recordPatternValue['ll'] + "\n" +
                                                    "lh: " + recordPatternValue['lh'] + "\n" +
                                                    "hl: " + recordPatternValue['hl'] + "\n" +
                                                    "Date Entry: " + recordPatternValue['entrypricedate'].toUTCString()

                                                Telegram.sendMessage(message)
                                            }
                                        }
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

function downloadCandlestick(timeframe, token, candles) {

    return new Promise(function (resolve, reject) {

        binance.candlesticks(token, timeframe, (error, ticks, symbol) => {

            if (error !== null) reject(error)
            if (_.isEmpty(ticks)) reject(error)

            let closeArray = [];
            if (!_.isEmpty(ticks)) {

                for (let t of ticks) {
                    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = t;
                    closeArray.push(parseFloat(close));
                }
                closeArray.pop()
                resolve(closeArray)
            } else {
                reject(error)
            }

        }, {limit: candles});
    });
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
                resolve()
            }
        );

    });
}

(async () => {

    try {

        // schedule.scheduleJob('* * * * *', function (fireDate) {
        //     console.log('This job was supposed to run at ' + fireDate + ', but actually ran at ' + new Date());
        // });


        // // // // terminate websocket
        // setInterval(function () {
        //     endpointsArr = []
        //     // Terminate all websocket endpoints, every 6 sec
        //     let endpoints = binance.websockets.subscriptions();
        //     for (let endpoint in endpoints) {
        //         //console.log("..websocket: " + endpoint);
        //         endpointsArr.push(endpoint)
        //         //let ws = endpoints[endpoint];
        //         //ws.terminate();
        //     }
        // }, 1000);

        await exchangeInfoFull().then(async () => {

            let tickerPrice = await binance.prices();

            for (const token in exchangeInfoArray) {

                downloadCandlestick('1d', token, 150).then((result) => {

                    if (result !== undefined) {

                        let ema = EMA.calculate({period: 5, values: result})
                        let lastEma = _.last(ema);

                        if (lastEma !== undefined && lastEma > 0) {
                            if (tickerPrice[token] !== null && tickerPrice[token] > 0) {

                                let currentPrice = tickerPrice[token]
                                if (currentPrice > lastEma) {
                                    return token
                                }
                            }
                        }
                    }
                    return undefined;

                }).then((result) => {

                    if (result !== undefined) {

                        for (let time of timeFrame) {
                            let key = token + "_" + time
                            exclusionList[key] = false;
                            entryCoins[key] = false;
                            indexArray[key] = -1;
                            tokenArray[key] = [];
                            emaArray[key] = null;
                            recordPattern[key] = null;
                            takeProfitArray[key] = null;
                            stopLossArray[key] = null;
                            entryArray[key] = null;
                        }

                        engine(token);
                    }

                }).catch(() => {
                });
            }
        }).catch(() => {
        });

    } catch (e) {
        console.log(e)
    }

})();






