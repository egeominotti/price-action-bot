//const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const mongoose = require("mongoose");
const _ = require("lodash");
const Bot = require("../models/bot");
const cors = require('cors')
const express = require("express");
const schedule = require('node-schedule');

const port = 3000;

const app = express();
app.use(cors());
app.listen(port)

mongoose.connect(process.env.URI_MONGODB);

const binance = new Binance().options({
    //recvWindow: 60000, // Set a higher recvWindow to increase response timeout
    useServerTime: true,
    // verbose: true, // Add extra output when subscribing to WebSockets, etc
    // log: log => {
    //     console.log(log); // You can create your own logger here, or disable console output
    // }
});


let timeFrame = [
    '1m',
    // '15m',
    // '1h',
    // '4h',
    // '1d',
];

let telegramEnabled = true;
let tradeEnabled = false;

let balance = 3000
let variableBalance = 0;
let totalPercentage = 0
let sumSizeTrade = 0;
const sizeTrade = 200;
let floatingValue = 0;
let floatingPercValue = 0;

let floatingPercArr = {};
let floatingArr = {};
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


app.get('/info', (req, res) => {
    let obj = {
        'balance': variableBalance,
        'sizeTrade': sizeTrade,
        'tradeEnabled': tradeEnabled,
        'telegramEnabled': telegramEnabled,
        'floatingperc': floatingPercValue,
        'floating': floatingValue,
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
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.entryArray);
});

app.get('/trade/takeprofit', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.takeProfitArray);
});

app.get('/trade/stoploss', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.stopLossArray);
});

app.get('/tokenArray', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.tokenArray);
});

app.get('/exchangeInfoArray', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.exchangeInfoArray);
});

app.get('/getExclusionList', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.exclusionList);
});

app.get('/getEntryCoins', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.entryCoins);
});

app.get('/getRecordPattern', async (req, res) => {
    const dbData = await Bot.findOne({name: dbKey});
    res.send(dbData.recordPattern);
});

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
    'floatingArr': floatingArr,
    'floatingPercArr': floatingPercArr,
    'takeProfitArray': takeProfitArray,
    'stopLossArray': stopLossArray,
    'entryArray': entryArray,
    'exchangeInfoArray': exchangeInfoArray,
    //Info DB
    'dbKey': dbKey,

}

schedule.scheduleJob('* * * * *', function () {

    console.log('---------------- Calculate Floating -------------------- ');

    floatingPercValue = 0;
    floatingValue = 0;

    for (let time of timeFrame) {
        for (const pair in exchangeInfoArray) {
            let key = pair + "_" + time
            floatingPercValue += floatingPercArr[key];
            floatingValue += floatingArr[key]
        }
    }

    console.log("Percentage... " + _.round(floatingPercValue, 2) + " %")
    console.log("Increment/Decrement... " + _.round(floatingValue, 2) + " $")
    console.log('------------------------------------------------- ');

});

Exchange.exchangeInfo(obj).then(async (listPair) => {

    console.log("----------------------------------------------------")
    console.log("LOADED for scanning... " + listPair.length + " pair")
    console.log("---------------------------------------------------")

    for (const time of timeFrame) {

        binance.websockets.candlesticks(listPair, time, (candlesticks) => {
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

                let position = sizeTrade / entryArray[key]['entryprice'];
                let floatingPosition = position * parseFloat(close);
                let floatingtrade = floatingPosition - sizeTrade;
                let floatingtradeperc = (floatingPosition - sizeTrade) / sizeTrade

                floatingArr[key] = floatingtrade;
                floatingPercArr[key] = floatingtradeperc;

                Algorithms.checkExit(obj)
            }

            if (isFinal) {

                obj['close'] = parseFloat(close);
                obj['high'] = parseFloat(high);
                obj['open'] = parseFloat(open);
                obj['low'] = parseFloat(low);

                let closeEMA = parseFloat(close);
                let currentClose = parseFloat(close)

                if (interval === '1d') {
                    if (exclusionList[key] === true) exclusionList[key] = false;
                } else {
                    closeEMA = undefined;
                }

                Indicators.ema(closeEMA, symbol, '1d', 5, 150, emaDaily).then((ema) => {

                    if (entryArray[key] === null) {

                        if (currentClose > ema) {

                            obj['symbol'] = symbol;
                            obj['key'] = key;
                            obj['interval'] = interval;

                            //console.log("TREND SCANNING... ema below close price: " + symbol + " - " + interval + " - EMA5: " + ema + " - Close: " + close)
                            Algorithms.checkEntry(obj)
                        }
                    }

                    // Se la close è sotto l'ema applico il trailing stop loss | trailing take profit
                    if (currentClose < ema) {

                        if (entryArray[key] !== null) {
                            Algorithms.forceSell(obj)
                        } else {
                            recordPattern[key] = null;
                            indexArray[key] = -1;
                            tokenArray[key] = [];
                        }
                    }

                }).catch((err) => {
                    console.log(err)
                })

            }
        });
    }


}).catch((err) => {
    console.log(err)
});

