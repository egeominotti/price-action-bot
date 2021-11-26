const Binance = require('node-binance-api');
const logic = require('./logic');
//const coins = require('./coins');
const fs = require('fs');
const _ = require("lodash");
const binance = new Binance();
const args = process.argv;

let coins = []
let timeFrame = args[2]
let tokenArray = {}
let indexArray = {};
let recordPattern = {}


let users = [
    {
        'nome': 'egeo',
        'key': 'g4m5LHCwMI1evVuaf6zgKXtszDnSboQla5O5c7uWVtBmdbaiTLNQWPnO9ImbYB9U',
        'secret': 'b2kxHirJLXDrXuFGvLWUtXvRyUXQu4NvsY8lSy94bJjnJFn0SmESuBq60DJi9b0B',
        'binance': null,
    },
    {
        'nome': 'carlo',
        'key': 'qElsCKJ7X6Dk8W7WmC5ww3z5nYl3mrAGHGhq1TtG3pOlje6cE0tX2bjSpwrWbJwC',
        'secret': 'Vyx1jqaKWHv4SWr7aoRoalVIkaDQXh8pg5E9bi3lPDLh9p7tieHfCDvQaFKcsKJj',
        'binance': null,
    }
]


// for (const user of users) {
//     let buy = false;
//     let binanceUserTrade = new Binance().options({
//         APIKEY: user.key,
//         APISECRET: user.secret
//     });
//     user.binance = binanceUserTrade
//     binanceUserTrade.balance(function (error, balances) {
//         console.log("balances()", balances);
//         if (typeof balances.USDT !== "undefined") {
//             console.log("USDT balance: ", balances.USDT.available);
//         }
//     });
// }
// console.log(users)

// Con api compro o vendo


let startMessage = 'Bot Pattern Analysis System Started for interval: ' + timeFrame
logic.sendMessageTelegram(startMessage)

fs.readFile('symbols.json', 'utf8', function (err, data) {

    if (err) {
        return console.log(err);
    }

    let parsedData = JSON.parse(data)
    for (const [key, value] of Object.entries(parsedData)) {
        coins.push(key)
    }

    for (const token of coins) {
        indexArray[token] = -1;
        tokenArray[token] = [];
        recordPattern[token] = [];
    }

    binance.websockets.candlesticks(coins, timeFrame, (candlesticks) => {

        let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
        let {
            o: open,
            h: high,
            l: low,
            c: close,
            i: interval,
            x: isFinal,
        } = ticks;


        // if (!_.isEmpty(recordPattern[symbol]) && recordPattern[symbol]['confirm'] === true) {
        //
        //     let takeprofit = recordPattern[symbol]['takeprofit']
        //     let stoploss = recordPattern[symbol]['stoploss']
        //     let entryprice = recordPattern[symbol]['entryprice']
        //
        //     // Controllo STOP_LOSS
        //     // Controllo TAKE_PROFIT
        //     if (close >= position.MAX_LH) {
        //         // Compro a prezzo di mercato
        //         //binance.marketBuy("BNBBTC", quantity);
        //         buy = true;
        //     }
        //
        //     if (buy) {
        //         // Stop Loss
        //         if (close < stoploss) {
        //             // binance.marketSell("ETHBTC", quantity);
        //             tradePosition[symbol] = []
        //         } else {
        //             // TAKE PROFIT
        //             if (close >= takeprofit) {
        //                 //binance.marketSell("ETHBTC", quantity);
        //                 tradePosition[symbol] = []
        //             }
        //         }
        //     }
        // }

        let nameFile = 'data/pattern_' + interval + ".json";

        if (isFinal) {

            if (_.isEmpty(recordPattern[symbol])) {

                indexArray[symbol] += 1

                let ticker = {
                    'index': parseInt(indexArray[symbol]),
                    'symbol': symbol.toString(),
                    'open': parseFloat(open),
                    'close': parseFloat(close),
                    'low': parseFloat(low),
                    'high': parseFloat(high),
                    'interval': interval.toString(),
                    'time': new Date()
                }

                tokenArray[symbol].push(ticker)
                let pattern = logic.patternMatching(tokenArray[symbol], symbol)
                if (!_.isEmpty(pattern)) {

                    let recordPatternData = {
                        'symbol': symbol,
                        'time': pattern['patternFoundTime'],
                        'entryprice': pattern['entryprice'],
                        'takeprofit': pattern['takeprofit'],
                        'stoploss': pattern['stoploss'],
                        'hh': pattern['hh'],
                        'll': pattern['ll'],
                        'lh': pattern['lh'],
                        'hl': pattern['hl'],
                        'confirmed': false,
                    }

                    recordPattern[symbol].push(recordPatternData)

                    tokenArray[symbol] = [];
                    indexArray[symbol] = -1

                    fs.writeFile(nameFile, JSON.stringify(recordPattern, null, 4), function (err) {
                    });

                }

            } else {

                console.log(close)
                console.log(recordPattern[symbol])
                console.log("STO CERCANDO ENTRATA")

                if (low < recordPattern[symbol]['ll'] || high > recordPattern[symbol]['hh']) {

                    console.log("DEVO FERMARMI")
                    // Cancello il pattern e ricominco
                    recordPattern[symbol] = []

                } else {

                    if (close > recordPattern[symbol]['lh']) {

                        let message = "Symbol: " + symbol + "\n" +
                            "Interval: " + interval + "\n" +
                            "Entry found at: " + recordPattern[symbol]['patternFoundTime'] + "\n" +
                            "entryprice: " + recordPattern[symbol]['entryprice'] + "\n" +
                            "takeprofit: " + recordPattern[symbol]['takeprofit'] + "\n" +
                            "stoploss:  " + recordPattern[symbol]['stoploss'] + "\n" +
                            "hh: " + recordPattern[symbol]['hh'] + "\n" +
                            "ll: " + recordPattern[symbol]['ll'] + "\n" +
                            "lh: " + recordPattern[symbol]['lh'] + "\n" +
                            "hl: " + recordPattern[symbol]['hl']

                        recordPattern[symbol]['confirmed'] = true
                        logic.sendMessageTelegram(message)
                    }
                }

            }
        }

    });
});
