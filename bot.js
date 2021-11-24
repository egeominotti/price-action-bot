const Binance = require('node-binance-api');
const logic = require('./logic');
const coins = require('./coins');
const _ = require("lodash");
const binance = new Binance();
const args = process.argv;

let timeFrame = args[2]
let tokenArray = {}
let indexArray = {};
let tradePosition = {}

let users = [
    {
        'nome': 'egeo',
        'key': 'g4m5LHCwMI1evVuaf6zgKXtszDnSboQla5O5c7uWVtBmdbaiTLNQWPnO9ImbYB9U',
        'secret': 'b2kxHirJLXDrXuFGvLWUtXvRyUXQu4NvsY8lSy94bJjnJFn0SmESuBq60DJi9b0B'
    },
    {
        'nome': 'carlo',
        'key': 'qElsCKJ7X6Dk8W7WmC5ww3z5nYl3mrAGHGhq1TtG3pOlje6cE0tX2bjSpwrWbJwC',
        'secret': 'Vyx1jqaKWHv4SWr7aoRoalVIkaDQXh8pg5E9bi3lPDLh9p7tieHfCDvQaFKcsKJj'
    }
]

for (const token of coins.getCoins()) {
    indexArray[token] = -1;
    tokenArray[token] = [];
    tradePosition[token] = [];
}

let startMessage = 'Bot Pattern Analysis System Started for interval: ' + timeFrame
logic.sendMessageTelegram(startMessage)

binance.websockets.candlesticks(coins.getCoins(), timeFrame, (candlesticks) => {

    let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
    let {
        o: open,
        h: high,
        l: low,
        c: close,
        i: interval,
        x: isFinal,
    } = ticks;

    for (const user of users) {

        let buy = false;
        let binanceUserTrade = new Binance().options({
            APIKEY: user.key,
            APISECRET: user.secret
        });
        // Con api compro o vendo
        for (const position of tradePosition)
        {
            // Controllo STOP_LOSS
            // Controllo TAKE_PROFIT
            if (close >= position.MAX_LH) {
                // Compro a prezzo di mercato
                //binance.marketBuy("BNBBTC", quantity);
                buy = true;
            }

            if (buy) {
                // Stop Loss
                if (close < position.STOP_LOSS) {
                    // binance.marketSell("ETHBTC", quantity);
                } else {
                    // TAKE PROFIT
                    if (close >= position.TAKE_PROFIT) {
                        //binance.marketSell("ETHBTC", quantity);
                    }
                }
            }
        }
    }

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

        console.log(interval)
        console.log(tokenArray[symbol])
        tokenArray[symbol].push(ticker)

        let pattern = logic.patternMatching(tokenArray[symbol])
        if (!_.isEmpty(pattern)) {

            tokenArray[symbol] = [];
            indexArray[symbol] = -1

            let tradePosition = {
                'symbol': symbol,
                'STOP_LOSS': pattern['STOP_LOSS'],
                'TAKE_PROFIT': pattern['TAKE_PROFIT'],
                "MAX_HH": pattern['MAX'],
                "MIN_LL:": pattern['MIN'],
                "MAX_LH": pattern['LH'],
                "MIN_HL": pattern['HL']
            }
            tradePosition[symbol].push(tradePosition)

            let message = 'SYMBOL: ' + symbol + "\n" +
                'INTERVAL: ' + interval + "\n" +
                'PATTERN FOUND AT: ' + pattern['patternFoundTime'] + "\n" +
                "ENTRY_PRICE: " + pattern['ENTRY_PRICE'] + "\n" +
                "TAKE_PROFIT: " + pattern['TAKE_PROFIT'] + "\n" +
                "STOP_LOSS:  " + pattern['STOP_LOSS'] + "\n" +
                "MAX_HH: " + pattern['MAX'] + "\n" +
                "MIN_LL: " + pattern['MIN'] + "\n" +
                "MAX_LH: " + pattern['LH'] + "\n" +
                "MIN_HL " + pattern['HL']

            logic.sendMessageTelegram(message)

        } else {
            console.log("Running for found pattern | HH | LL | LH | HL .... " + symbol)
        }
    }
});



