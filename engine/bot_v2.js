const _ = require("lodash");
const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const API = require("../api/api");
const schedule = require('node-schedule');
const {decreasePosition} = require("../algorithm/algorithm");

global.binance = new Binance().options({
    verbose: false,
    log: log => {
        console.log(log);
    }
});


// BOT CONFIGURATION
global.balance = 2400;
global.sizeTrade = 200;
global.volumeMetrics = 200000
global.maxEntry = (balance / sizeTrade) - 1
global.telegramEnabled = true;
global.tradeEnabled = true;
// END-BOT-CONFIGURATION

global.variableBalance = 0;
global.totalPercentage = 0
global.sumSizeTrade = 0;
global.totalFloatingValue = 0;
global.totalFloatingPercValue = 0;
global.totalFloatingBalance = 0;
global.totalEntry = 0;

global.listEntry = {};
global.emaArray = {};
global.floatingPercArr = {};
global.floatingArr = {};
global.tokenArray = {}
global.exchangeInfoArray = {}
global.indexArray = {}
global.recordPattern = {}
global.exclusionList = {}
global.entryCoins = {}
global.takeProfitArray = {}
global.stopLossArray = {}
global.entryArray = {}

global.finder = [];

global.timeFrame = [
    '5m',
    '15m',
    '1d',
];


schedule.scheduleJob('0 * * * *', function () {

    if (totalEntry > 0) {

        let message = "Global Statistics Profit/Loss" + "\n" +
            "-------------------------------------------------" + "\n" +
            "Total pair purchased: " + totalEntry + "\n" +
            "Start Balance: " + balance + " $" + "\n" +
            "Variable Balance: " + variableBalance + " $" + "\n" +
            "Size Trade: " + sizeTrade + " $" + "\n" +
            "Total Floating Balance: " + _.round(totalFloatingBalance, 2) + " $" + "\n" +
            "Total Floating Percentage: " + _.round(totalFloatingPercValue, 2) + " %" + "\n" +
            "Total Floating Profit/Loss: " + _.round(totalFloatingValue, 2) + " $" + "\n" +
            "-------------------------------------------------"

        Telegram.sendMessage(message)
    }

});


(async () => {

    let exchangePair = Exchange.initData(await binance.exchangeInfo());
    let message = "Hi from HAL V2" + "\n" +
        "LOADED for scanning... " + exchangePair.length + " pair" + "\n"
    Telegram.sendMessage(message)

    for (let time of timeFrame) {

        binance.websockets.candlesticks(exchangePair, time, async (candlesticks) => {
            let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
            let {
                o: open,
                h: high,
                l: low,
                c: close,
                v: volume,
                n: trades,
                i: interval,
                x: isFinal,
                q: quoteVolume,
                V: buyVolume,
                Q: quoteBuyVolume
            } = ticks;

            let key = symbol + "_" + interval;

            if (finder.length > 0 &&
                finder.includes(symbol) &&
                exclusionList[key] === false &&
                entryArray[key] !== null &&
                recordPattern[key] !== null &&
                recordPattern[key]['confirmed'] === true
            ) {

                let obj = {
                    'symbol': symbol,
                    'key': key,
                    'recordPattern': recordPattern[key],
                    'interval': interval,
                    'close': parseFloat(close),
                    'high': parseFloat(high),
                    'open': parseFloat(open),
                    'low': parseFloat(low)
                }

                Algorithms.checkFloating(obj);
                Algorithms.checkExit(obj);
            }

            if (isFinal) {

                let currentClose = parseFloat(close);

                if (currentClose > 0.1) {

                    if (interval === '1d') {

                        binance.prevDay(symbol, (error, prevDay, symbol) => {

                            if (prevDay.priceChangePercent > 2) {

                                if (exclusionList[key] === true)
                                    exclusionList[key] = false;

                                Indicators.emaWithoutCache(symbol, '1d', 5, 150)

                                    .then((ema) => {
                                        if (!isNaN(ema) && ema > 0.1) {

                                            if (currentClose > ema) {
                                                if (!finder.includes(symbol)) {
                                                    //if (prevDay.volume > volumeMetrics) {
                                                    console.log("ADD:FINDER... add new pair in scanning: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + prevDay.volume + " - PRICE CHANGED - " + prevDay.priceChangePercent + " %");
                                                    finder.push(symbol);
                                                    //}
                                                }
                                            }

                                            if (currentClose < ema) {

                                                if (finder.includes(symbol)) {

                                                    if (entryArray[key] !== null) {
                                                        Algorithms.closePosition(symbol);
                                                        decreasePosition(key)
                                                    }

                                                    // cancello i record
                                                    if (entryArray[key] == null) {
                                                        recordPattern[key] = null;
                                                        indexArray[key] = -1;
                                                        tokenArray[key] = [];
                                                    }

                                                    for (let i = 0; i < finder.length; i++) {
                                                        if (finder[i] !== null) {
                                                            if (finder[i] === symbol) {
                                                                console.log("REMOVE:FINDER... remove pair from scanning: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + quoteBuyVolume + +" - PRICE CHANGED - " + prevDay.priceChangePercent + " %");
                                                                finder.splice(i, 1);
                                                            }
                                                        }
                                                    }

                                                }
                                            }

                                        }

                                    })
                                    .catch((e) => {
                                        console.log(e);
                                        for (let i = 0; i < finder.length; i++) {
                                            if (finder[i] !== null) {
                                                if (finder[i] === symbol) {
                                                    console.log("ERROR:REMOVE:FINDER... remove pair from scanning: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + quoteBuyVolume + +" - PRICE CHANGED - " + prevDay.priceChangePercent + " %");
                                                    finder.splice(i, 1);
                                                }
                                            }
                                        }
                                    });
                            }
                        });


                    } else {

                        if (finder.length > 0 &&
                            finder.includes(symbol) &&
                            totalEntry <= maxEntry
                        ) {

                            if (exclusionList[key] === false &&
                                entryCoins[key] === false) {

                                let obj = {
                                    'symbol': symbol,
                                    'key': key,
                                    'interval': interval,
                                    'close': parseFloat(close),
                                    'high': parseFloat(high),
                                    'open': parseFloat(open),
                                    'low': parseFloat(low)
                                }

                                Algorithms.checkEntry(obj);
                            }
                        }

                        if (totalEntry === maxEntry + 1 &&
                            recordPattern[key] !== null &&
                            recordPattern[key]['confirmed'] === true
                        ) {
                            Algorithms.decreasePosition(key)
                        }
                    }
                }


            }

        });

    }

})();


