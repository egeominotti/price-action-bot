const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const API = require("../api/api");
const _ = require("lodash");

global.binance = new Binance().options({
    verbose: false,
    log: log => {
        console.log(log);
    }
});

global.telegramEnabled = true;
global.tradeEnabled = false;
global.balance = 3000;
global.variableBalance = 0;
global.totalPercentage = 0
global.sumSizeTrade = 0;
global.sizeTrade = 200;
global.maxEntry = (balance / sizeTrade) - 1
global.totalFloatingValue = 0;
global.totalFloatingPercValue = 0;
global.totalFloatingBalance = 0;
global.totalEntry = 0;
global.listEntry = {};
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


setInterval(() => {

    if (totalEntry > 0) {
        let message = "Global Statistics Profit/Loss" + "\n" +
            "--------------------------------------------------------------------" + "\n" +
            "Total pair in trading: " + totalEntry + "\n" +
            "Total Floating Balance: " + _.round(totalFloatingBalance, 2) + " $" + "\n" +
            "Total Floating Percentage: " + _.round(totalFloatingPercValue, 2) + " %" + "\n" +
            "Total Floating Profit/Loss: " + _.round(totalFloatingValue, 2) + " $"

        Telegram.sendMessage(message)
    }

}, 300000);

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
                v: volume,
                c: close,
                i: interval,
                x: isFinal,
            } = ticks;

            let key = symbol + "_" + interval;

            if (finder.length > 0 &&
                finder.includes(symbol) &&
                exclusionList[key] === false &&
                entryArray[key] !== null &&
                recordPattern[key] !== null &&
                recordPattern[key]['confirmed'] === true) {
                console.log("SONO ENTRATO")
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
                console.log(obj)

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

                                if (currentClose > ema) {
                                    if (!finder.includes(symbol)) {
                                        let currentVolume = parseFloat(volume);
                                        finder.push(symbol);
                                        // 100000000
                                        // if (currentVolume > 1000) {
                                        //     console.log("TRADABILE")
                                        //     console.log(symbol)
                                        //     console.log(currentVolume)
                                        //     console.log(trades)
                                        //     console.log("ADD:FINDER... add new pair in scanning: " + symbol + " - " + interval + " - EMA5 " + ema)
                                        //     finder.push(symbol);
                                        // }

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

                                        if (entryArray[key] !== null) {
                                            //CLOSE POSITION - TRAILING STOP LOSS O TAKE PROFIT
                                        }

                                        for (let i = 0; i < finder.length; i++) {
                                            if (finder[i] !== null) {
                                                if (finder[i] === symbol) {
                                                    console.log("REMOVE:FINDER... remove pair from scanning: " + symbol + " - " + interval + " - EMA5 " + ema)
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

                    if (finder.length > 0 && finder.includes(symbol) && totalEntry <= maxEntry) {
                        if (exclusionList[key] === false && entryCoins[key] === false) {

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
                }
            }

        });

    }

})();


