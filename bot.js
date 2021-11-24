const Binance =     require('node-binance-api');
const logic =       require('./logic');
const coins =       require('./coins');
const _ =           require("lodash");
const binance =     new Binance();
const args =        process.argv;

let timeFrame = args[2]
let tokenArray = {}
let indexArray = {};
let tradePosition = {}
let users = [
    {
        'nome': 'egeo',
        'api_keu': '144',
        'api_secre': '334'
    },
        {
        'nome': 'carlo',
        'api_keu': '144',
        'api_secre': '334'
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

    for(const user of users){
        // Con api compro o vendo
        for(const position of tradePosition){
            // Controllo STOP_LOSS
            // Controllo TAKE_PROFIT
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
                'STOP_LOSS' : pattern['STOP_LOSS'],
                'TAKE_PROFIT': pattern['TAKE_PROFIT'],
            }
            tradePosition[symbol].push(tradePosition)

            let message = 'SYMBOL: ' + symbol + "\n" +
                'INTERVAL: ' + interval + "\n" +
                'PATTERN FOUND AT: ' + pattern['patternFoundTime'] + "\n" +
                "ENTRY_PRICE: " + pattern['ENTRY_PRICE'] + "\n" +
                "TAKE_PROFIT: " + pattern['TAKE_PROFIT'] + "\n" +
                "STOP_LOSS:: " + pattern['STOP_LOSS'] + "\n" +
                "MIN_LL: " + pattern['MIN'] + "\n" +
                "MAX_HH: " + pattern['MAX']

                // "HH_confirm open: " + pattern['HH']['tick']['open'] + "\n" +
                // "HH_confirm high: " + pattern['HH']['tick']['high'] + "\n" +
                // "HH_confirm low: " + pattern['HH']['tick']['low'] + "\n" +
                // "HH_confirm close: " + pattern['HH']['tick']['close'] + "\n" +
                // "HH_confirm time: " + pattern['HH']['tick']['time'] + "\n" +
                //
                // "LL_confirm open: " + pattern['LL']['tick']['open'] + "\n" +
                // "LL_confirm high: " + pattern['LL']['tick']['high'] + "\n" +
                // "LL_confirm low: " + pattern['LL']['tick']['low'] + "\n" +
                // "LL_confirm close: " + pattern['LL']['tick']['close'] + "\n" +
                // "LL_confirm time: " + pattern['LL']['tick']['time'] + "\n" +
                //
                // "LH_confirm open: " + pattern['LH']['tick']['open'] + "\n" +
                // "LH_confirm high: " + pattern['LH']['tick']['high'] + "\n" +
                // "LH_confirm low: " + pattern['LH']['tick']['low'] + "\n" +
                // "LH_confirm close: " + pattern['LH']['tick']['close'] + "\n" +
                // "LH_confirm time: " + pattern['LH']['tick']['time'] + "\n" +
                //
                // "HL_confirm open: " + pattern['HL']['tick']['open'] + "\n" +
                // "HL_confirm high: " + pattern['HL']['tick']['high'] + "\n" +
                // "HL_confirm low: " + pattern['HL']['tick']['low'] + "\n" +
                // "HL_confirm close: " + pattern['HL']['tick']['close'] + "\n" +
                // "HL_confirm time: " + pattern['HL']['tick']['time']

            logic.sendMessageTelegram(message)

        } else {
            console.log("Running for found pattern | HH | LL | LH | HL .... " + symbol)
        }
    }
});



