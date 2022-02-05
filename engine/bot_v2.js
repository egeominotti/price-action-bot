const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const mongoose = require("mongoose");
const _ = require("lodash");
const cors = require('cors')
const express = require("express");

const port = 3000;
const app = express();
app.use(cors());
app.listen(port)

mongoose.connect(process.env.URI_MONGODB);

const binance = new Binance().options({
    //recvWindow: 30000, // Set a higher recvWindow to increase response timeout
    useServerTime: true,
    verbose: false, // Add extra output when subscribing to WebSockets, etc
    log: log => {
        console.log(log); // You can create your own logger here, or disable console output
    }
});


let timeFrame = [
    '1m',
    //'15m',
    //'1h',
    //'4h',
];

let telegramEnabled = true;
let tradeEnabled = false;

let balance = 3000
let variableBalance = 0;
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;

let totalFloatingValue = 0;
let totalFloatingPercValue = 0;
let totalFloatingBalance = 0;

let floatingPercArr = {};
let floatingArr = {};
let tokenArray = {}
let exchangeInfoArray = {}
let indexArray = {}
let recordPattern = {}
let exclusionList = {}
let entryCoins = {}
let takeProfitArray = {}
let stopLossArray = {}
let entryArray = {}

let dbKey = 'prova_2';


app.get('/info', (req, res) => {
    let obj = {
        'balance': variableBalance,
        'sizeTrade': sizeTrade,
        'tradeEnabled': tradeEnabled,
        'telegramEnabled': telegramEnabled,
        'floatingperc': totalFloatingPercValue,
        'floating': totalFloatingValue,
        'floatingbalance': totalFloatingBalance,
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
    //
    // for (let time of timeFrame) {
    //     for (const token of coinsArray) {
    //         let key = token + "_" + time
    //         if (recordPattern[key] !== null) {
    //             if (tradeEnabled) {
    //                 for (let objBinance in arrObjectInstanceBinance) {
    //                     objBinance.balance((error, balances) => {
    //                         if (error) return console.error(error);
    //                         //console.log(exchangeInfoArray[token])
    //                         let sellAmount = binance.roundStep(balances[token].available, exchangeInfoArray[token].stepSize);
    //                         binance.marketSell(token, sellAmount);
    //                     });
    //                 }
    //             }
    //         }
    //     }
    // }
    res.send({'stop_all': true});

});


app.get('/trade/entry', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(entryArray);
});

app.get('/trade/takeprofit', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(takeProfitArray);
});

app.get('/trade/stoploss', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(stopLossArray);
});

app.get('/tokenArray', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(tokenArray);
});

app.get('/exchangeInfoArray', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(exchangeInfoArray);
});

app.get('/getExclusionList', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(exclusionList);
});

app.get('/getEntryCoins', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(entryCoins);
});

app.get('/getRecordPattern', async (req, res) => {
    //const dbData = await Bot.findOne({name: dbKey});
    res.send(recordPattern);
});

let totalEntry = 0
let listEntry = {};

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
    'listEntry': listEntry,
    'recordPattern': recordPattern,
    'indexArray': indexArray,
    'tokenArray': tokenArray,
    'entryCoins': entryCoins,
    'floatingArr': floatingArr,
    'floatingPercArr': floatingPercArr,
    'takeProfitArray': takeProfitArray,
    'stopLossArray': stopLossArray,
    'entryArray': entryArray,
    'exchangeInfoArray': exchangeInfoArray,
    //Info DB
    'dbKey': dbKey,

}

let started = false;
let pairs = [];

Exchange.exchangeInfo().then(async (listPair) => {

    new Binance().websockets.candlesticks(listPair, '1m', async (candlesticks) => {
        let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
        let {
            c: close,
            x: isFinal,
        } = ticks;

        let currentClose = parseFloat(close)

        if (isFinal) {

            Indicators.emaWithoutCache(symbol, '1d', 5, 150)

                .then((ema) => {

                    if (!isNaN(ema)) {

                        if (currentClose > ema) {
                            if (!pairs.includes(symbol)) {
                                pairs.push(symbol)
                            }
                        }

                        if (currentClose < ema) {
                            for (let i = 0; i < pairs.length; i++) {
                                if (pairs[i] !== null) {
                                    if (pairs[i] === symbol) {
                                        pairs.splice(i, 1);
                                    }
                                }
                            }
                        }
                    }

                }).catch(() => {
            })
        }
    });

}).catch((err) => {
    console.log(err)
});


setInterval(() => {

    let message = "Global Statistics Profit/Loss" + "\n" +
        "--------------------------------------------------------------------" + "\n" +
        "Total Floating Balance: " + _.round(totalFloatingBalance, 2) + " $" + "\n" +
        "Total Floating Percentage: " + _.round(totalFloatingPercValue, 2) + " %" + "\n" +
        "Total Floating Profit/Loss: " + _.round(totalFloatingValue, 2) + " $"

    Telegram.sendMessage(message)

}, 60000);

(async () => {

    setInterval(() => {

        if (started === false && pairs.length > 0) {

            let message = "Hi from HAL V2" + "\n" +
                "LOADED for scanning... " + pairs.length + " pair" + "\n"
            Telegram.sendMessage(message)

            for (let time of timeFrame) {
                for (const token of pairs) {

                    let key = token + "_" + time

                    exclusionList[key] = false;
                    indexArray[key] = -1;
                    tokenArray[key] = [];
                    entryCoins[key] = false;
                    recordPattern[key] = null;
                    takeProfitArray[key] = null;
                    stopLossArray[key] = null;
                    entryArray[key] = null;
                    listEntry[key] = null;
                    floatingArr[key] = 0;
                    floatingPercArr[key] = 0;
                }
            }

            console.log("----------------------------------------------------")
            console.log("LOADED for scanning... " + pairs.length + " pair")
            console.log("---------------------------------------------------")

            started = true;

            for (const time of timeFrame) {

                binance.websockets.candlesticks(pairs, time, (candlesticks) => {
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

                    if (exclusionList[key] === false) {

                        if (entryArray[key] !== null) {

                            let position = sizeTrade / entryArray[key]['entryprice'];
                            let floatingPosition = position * parseFloat(close);
                            let floatingtrade = floatingPosition - sizeTrade;
                            let floatingtradeperc = ((floatingPosition - sizeTrade) / sizeTrade) * 100

                            floatingArr[key] = floatingtrade;
                            floatingPercArr[key] = floatingtradeperc;

                            obj['symbol'] = symbol;
                            obj['key'] = key;
                            obj['interval'] = interval;
                            obj['close'] = parseFloat(close);
                            obj['high'] = parseFloat(high);
                            obj['open'] = parseFloat(open);
                            obj['low'] = parseFloat(low);

                            console.log('---------------- Calculate Floating -------------------- ');
                            console.log("Pair... " + symbol)
                            console.log("Floating Percentage... " + _.round(floatingtradeperc, 2) + " %")
                            console.log("Floating Profit/Loss... " + _.round(floatingtrade, 2) + "$")
                            console.log('-------------------------------------------------------------- ');

                            totalFloatingValue = 0;
                            totalFloatingPercValue = 0;
                            totalFloatingBalance = 0;

                            for (let time of timeFrame) {
                                for (const token of pairs) {
                                    let keyFloating = token + "_" + time
                                    if (!isNaN(floatingArr[keyFloating]) && !isNaN(floatingPercArr[keyFloating])) {
                                        totalFloatingValue += floatingArr[keyFloating];
                                        totalFloatingPercValue += floatingPercArr[keyFloating];
                                    }
                                }
                            }

                            totalFloatingBalance = balance + totalFloatingValue;

                            let message = "Global Statistics Profit/Loss" + "\n" +
                                "--------------------------------------------------------------------" + "\n" +
                                "Total Floating Balance: " + _.round(totalFloatingBalance, 2) + " $" + "\n" +
                                "Total Floating Percentage: " + _.round(totalFloatingPercValue, 2) + " %" + "\n" +
                                "Total Floating Profit/Loss: " + _.round(totalFloatingValue, 2) + " $"

                            console.log(message)

                            let result = Algorithms.checkExit(obj)
                            if (result) {
                                // elimino la pair
                            }
                        }

                        if (isFinal) {

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

                });
            }
        }

    }, 60000);


})();







