const Binance = require('node-binance-api');
const logic = require('./logic');
const axios = require('axios').default;
const coins = require('./coins');
const fs = require('fs');
const _ = require("lodash");
const binance = new Binance();
const args = process.argv;

//let coins = []
let coinsArray = coins.getCoins()
let balance = 5000


binance.candlesticks("BNBBTC", "5m", (error, ticks, symbol) => {
    console.info("candlesticks()", ticks);
    let last_tick = ticks[ticks.length - 1];
    let [time, open, high, low, close, volume, closeTime, assetVolume, trades, buyBaseVolume, buyAssetVolume, ignored] = last_tick;
    console.info(symbol + " last close: " + close);
}, {limit: 500, startTime: 1514764800000, endTime: 1514764800000});
