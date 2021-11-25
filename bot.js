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
let tradePosition = {}

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
});


for (const token of coins) {
    indexArray[token] = -1;
    tokenArray[token] = [];
    tradePosition[token] = [];
}

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


    if (isFinal) {

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

        let pattern = logic.patternMatching(tokenArray[symbol])
        if (!_.isEmpty(pattern)) {

            console.log("Pattern found")

            tokenArray[symbol] = [];
            indexArray[symbol] = -1

            let tradeData = {
                'symbol': symbol,
                'STOP_LOSS': pattern['STOP_LOSS'],
                'TAKE_PROFIT': pattern['TAKE_PROFIT'],
                "MAX_HH": pattern['MAX'],
                "MIN_LL:": pattern['MIN'],
                "MAX_LH": pattern['LH'],
                "MIN_HL": pattern['HL']
            }

            //tradePosition[symbol].push(tradeData)

            let message = "SYMBOL: " + symbol + "\n" +
                "INTERVAL: " + interval + "\n" +
                "PATTERN FOUND AT: " + pattern['patternFoundTime'] + "\n" +
                "ENTRYPRICE: " + pattern['ENTRY_PRICE'] + "\n" +
                "TAKEPROFIT: " + pattern['TAKE_PROFIT'] + "\n" +
                "STOPLOSS:  " + pattern['STOP_LOSS'] + "\n" +
                "HH: " + pattern['HH'] + "\n" +
                "LL: " + pattern['LL'] + "\n" +
                "LH: " + pattern['LH'] + "\n" +
                "HL: " + pattern['HL']


            let recordPattern = {
                'symbol': symbol,
                'time': pattern['patternFoundTime'],
                'entryprice': pattern['ENTRY_PRICE'],
                'takeprofit': pattern['TAKE_PROFIT'],
                'stoploss': pattern['STOP_LOSS'],
                'hh': pattern['HH'],
                'll': pattern['LL'],
                'lh': pattern['LH'],
                'hl': pattern['HL']
            }

            fs.writeFile("recordPattern.json", JSON.stringify(recordPattern, null, 4), function (err) {});

            logic.sendMessageTelegram(message)

        } else {
            console.log("Running for found pattern | HH | LL | LH | HL .... " + symbol + " interval: " + interval)
        }
    }
});



