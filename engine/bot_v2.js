const config = require('../config');
const _ = require("lodash");
const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Algorithms = require('../algorithm/algorithm');
const Exchange = require("../exchange/binance");
const API = require("../api/api");
const schedule = require('node-schedule');
const {EMA} = require("technicalindicators");


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

                if (emaArray[key] !== undefined) {
                    emaArray[key].shift();
                    emaArray[key].push(parseFloat(close))

                } else {

                    binance.candlesticks(symbol, time, (error, ticks, symbol) => {
                        if (!_.isEmpty(ticks)) {
                            let closeArray = [];
                            for (let t of ticks) {
                                let [time, open, high, low, close, ignored] = t;
                                closeArray.push(parseFloat(close));
                            }
                            closeArray.pop()
                            emaArray[key] = closeArray
                        }

                    }, {limit: 500});
                }

                let currentClose = parseFloat(close);
                if (currentClose > 0.1) {

                    if (interval === '1m' && emaArray[key] !== undefined) {

                        if (exclusionList[key] === true)
                            exclusionList[key] = false;

                        binance.prevDay(symbol, (error, prevDay, symbol) => {

                            if (prevDay.priceChangePercent > 2) {

                                let ema = _.last(EMA.calculate({period: 5, values: emaArray[key]}))

                                if (!isNaN(ema) && ema > 0.1) {

                                    if (currentClose > ema) {
                                        if (!finder.includes(symbol)) {
                                            console.log("FINDER:ADD: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + prevDay.volume + " - PRICE CHANGED - " + prevDay.priceChangePercent + " %");
                                            finder.push(symbol);
                                        }
                                    }

                                    if (currentClose < ema) {

                                        if (finder.includes(symbol)) {

                                            if (entryArray[key] !== null) {
                                                Algorithms.closePosition(symbol);
                                                Algorithms.decreasePosition(key)
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
                                                        console.log("FINDER:REMOVE: " + symbol + " - " + interval + " - EMA5 " + ema + " - QUOTEVOLUME - " + prevDay.volume + +" - PRICE CHANGED - " + prevDay.priceChangePercent + " %");
                                                        finder.splice(i, 1);
                                                    }
                                                }
                                            }

                                        }
                                    }

                                }
                            }
                        });


                    } else {

                        if (finder.length > 0 &&
                            finder.includes(symbol) &&
                            totalEntry <= maxEntry &&
                            emaArray[key] !== undefined
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


