const _ = require("lodash");
const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const API = require("../api/api");
const schedule = require('node-schedule');

global.binance = new Binance().options({
    verbose: false,
    log: log => {
        console.log(log);
    }
});

global.balance = 1000;
global.sizeTrade = 100;

global.telegramEnabled = true;
global.tradeEnabled = true;
global.volumeMetrics = 200000
global.variableBalance = 0;
global.totalPercentage = 0
global.sumSizeTrade = 0;
global.totalFloatingValue = 0;
global.totalFloatingPercValue = 0;
global.totalFloatingBalance = 0;
global.totalEntry = 0;
global.maxEntry = (balance / sizeTrade) - 1

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
    '1h',
    '4h',
    '1d',
];


schedule.scheduleJob('*/30 * * * *', function () {

    if (totalEntry > 0) {

        let message = "Global Statistics Profit/Loss" + "\n" +
            "---------------------------------------" + "\n" +
            "Total pair purchased: " + totalEntry + "\n" +
            "Start Balance: " + balance + " $" + "\n" +
            "Variable Balance: " + variableBalance + " $" + "\n" +
            "Size Trade: " + sizeTrade + " $" + "\n" +
            "Total Floating Balance: " + _.round(totalFloatingBalance, 2) + " $" + "\n" +
            "Total Floating Percentage: " + _.round(totalFloatingPercValue, 2) + " %" + "\n" +
            "Total Floating Profit/Loss: " + _.round(totalFloatingValue, 2) + " $"

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

                if (interval === '1d') {

                    if (exclusionList[key] === true)
                        exclusionList[key] = false;

                    Indicators.emaWithoutCache(symbol, '1d', 5, 150)

                        .then((ema) => {

                            if (!isNaN(ema)) {

                                if (currentClose > ema && parseFloat(quoteVolume) > volumeMetrics) {
                                    if (!finder.includes(symbol)) {
                                        console.log("ADD:FINDER... add new pair in scanning: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + quoteBuyVolume);
                                        finder.push(symbol);
                                    }
                                }

                                if (currentClose < ema) {
                                    // Aggiungere che chiude tutte le posizioni che sono andate sotto ema
                                    if (finder.includes(symbol)) {

                                        // cancello i record
                                        if (entryArray[key] == null) {
                                            recordPattern[key] = null;
                                            indexArray[key] = -1;
                                            tokenArray[key] = [];
                                        }

                                        // Trailing stop-loss | trailing-profit
                                        // if (entryArray[key] !== null) {
                                        //     Exchange.sell(symbol);
                                        // }

                                        for (let i = 0; i < finder.length; i++) {
                                            if (finder[i] !== null) {
                                                if (finder[i] === symbol) {
                                                    console.log("REMOVE:FINDER... remove pair from scanning: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + quoteBuyVolume);
                                                    finder.splice(i, 1);
                                                }
                                            }
                                        }

                                    }
                                }
                            }

                        })
                        .catch((e) => {
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
                        entryArray[key] == null
                    ) {
                        recordPattern[key] = null;
                        indexArray[key] = -1;
                        tokenArray[key] = [];
                    }
                }
            }

        });

    }

})();


