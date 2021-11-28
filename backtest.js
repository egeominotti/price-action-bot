const Binance = require('node-binance-api');
const logic = require('./logic');
const axios = require('axios').default;
const coins = require('./coins');
const fs = require('fs');
const _ = require("lodash");
const binance = new Binance();
const args = process.argv;
const moment = require('moment');

//let coins = []
let coinsArray = coins.getCoins()
let balance = 5000


const timestampStart = Date.parse("26-02-2016".split('-').reverse().join('-'));
const timestampEnd = Date.parse(new Date())

let ticksArray = []

binance.candlesticks("ETHUSDT", "4h", (error, ticks, symbol) => {

    let index = 0;
    for (let t of ticks) {
        let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = t;

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
        let pattern = logic.patternMatching(ticksArray, symbol)
        if (!_.isEmpty(pattern)) {
            console.log(pattern)
        }

    }

}, {limit: 1000, endTime: timestampEnd});



