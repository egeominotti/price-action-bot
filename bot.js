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
// if (tradePosition[symbol] !== undefined) {
//     for (const position of tradePosition) {
//         console.log(position)
//         // Controllo STOP_LOSS
//         // Controllo TAKE_PROFIT
//         if (close >= position.MAX_LH) {
//             // Compro a prezzo di mercato
//             //binance.marketBuy("BNBBTC", quantity);
//             buy = true;
//         }
//
//         if (buy) {
//             // Stop Loss
//             if (close < position.STOP_LOSS) {
//                 // binance.marketSell("ETHBTC", quantity);
//                 tradePosition[symbol] = {}
//             } else {
//                 // TAKE PROFIT
//                 if (close >= position.TAKE_PROFIT) {
//                     //binance.marketSell("ETHBTC", quantity);
//                     tradePosition[symbol] = {}
//                 }
//             }
//         }
//     }
// }


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

        if (!_.isEmpty(recordPattern[symbol]) && recordPattern[symbol]['confirm'] === true) {
            // Faccio trading in realtime
            console.log("Controllo le posizioni da gestire")
            let takeprofit = recordPattern[symbol]['takeprofit']
            let stoploss = recordPattern[symbol]['stoploss']
            let entryprice = recordPattern[symbol]['entryprice']
            console.log("Sblocco la ricerca del pattern")
            recordPattern[symbol] = []
        }

        if (isFinal) {

            // Controlla che ci siano dei pattern da verificare e invia una notifica su telegram
            if (!_.isEmpty(recordPattern[symbol]) && recordPattern[symbol]['confirm'] === false) {

                console.log(recordPattern[symbol])
                if (close > recordPattern[symbol]['LH']) {

                    console.log("Pattern confermato");

                    let message = "SYMBOL: " + symbol + "\n" +
                        "INTERVAL: " + interval + "\n" +
                        "PATTERN FOUND AT: " + recordPattern[symbol]['patternFoundTime'] + "\n" +
                        "ENTRYPRICE: " + recordPattern[symbol]['ENTRY_PRICE'] + "\n" +
                        "TAKEPROFIT: " + recordPattern[symbol]['TAKE_PROFIT'] + "\n" +
                        "STOPLOSS:  " + recordPattern[symbol]['STOP_LOSS'] + "\n" +
                        "HH: " + recordPattern[symbol]['HH'] + "\n" +
                        "LL: " + recordPattern[symbol]['LL'] + "\n" +
                        "LH: " + recordPattern[symbol]['LH'] + "\n" +
                        "HL: " + recordPattern[symbol]['HL']

                    recordPattern[symbol]['confirm'] = true

                    logic.sendMessageTelegram(message)

                    fs.appendFile("recordPattern.json", JSON.stringify(recordPattern, null, 4), function (err) {
                    });
                    recordPattern[symbol] = []
                    console.log(recordPattern[symbol])
                }
            }


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

                if (_.isEmpty(recordPattern[symbol])) {

                    let recordPatternData = {
                        'symbol': symbol,
                        'time': pattern['patternFoundTime'],
                        'entryprice': pattern['ENTRY_PRICE'],
                        'takeprofit': pattern['TAKE_PROFIT'],
                        'stoploss': pattern['STOP_LOSS'],
                        'hh': pattern['HH'],
                        'll': pattern['LL'],
                        'lh': pattern['LH'],
                        'hl': pattern['HL'],
                        'confirmed': false,
                    }

                    console.log("SALVO PATTERN")
                    recordPattern[symbol].push(recordPatternData)
                    tokenArray[symbol] = [];
                    indexArray[symbol] = -1

                    console.log("Finito salvataggio pattern, procedo al controllo")
                    console.log(recordPattern[symbol])
                }
            }
        }
    });

});
