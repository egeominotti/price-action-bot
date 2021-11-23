const Binance = require('node-binance-api');
const {getFibRetracement, levels} = require('fib-retracement');

const binance = new Binance().options({
    APIKEY: '<key>',
    APISECRET: '<secret>'
});


let storeData = []
let entryPrice = 0
let stopLoss = 0
let ispatternMatching = false
let buy = false
let tickCounter = 0
let fibonacciPointMax = 0
let fibonacciPointMin = 0

function MaxTickHigh(storeData, startIndex) {

    let idMaxTickHigh;
    let tickerFounded;
    let highArray = [];


    if (startIndex !== undefined) {

        for (let index = startIndex; index < storeData.length; ++index) {
            let tick = storeData[index];
            highArray.push(tick['low'])
        }

        // Trovo il minimo tra tutte le candele low partendo dall'indice trovato dall' HH
        let max = Math.min(...highArray)

        for (let index = startIndex; index < storeData.length; ++index) {
            let tick = storeData[index];
            if (tick['low'] === max) {
                idMaxTickHigh = tick['index']
                tickerFounded = tick;
            }
        }

        return {
            'max': max,
            'index': idMaxTickHigh,
            'tick': tickerFounded,
        };

    } else {

        for (const tick of storeData) {
            highArray.push(tick['high'])
        }

        let max = Math.max(...highArray)

        for (const tick of storeData) {
            if (tick['high'] === max) {
                idMaxTickHigh = tick['index']
                tickerFounded = tick;
            }
        }

        return {
            'max': max,
            'index': idMaxTickHigh,
            'tick': tickerFounded,
        };
    }


}

function MinTickLow(storeData, indexMax) {

    let lowArray = [];
    let tickerFounded;
    let indexMin;

    for (let index = indexMax; index < storeData.length; ++index) {
        let tick = storeData[index];
        lowArray.push(tick['low'])
    }

    // Trovo il minimo tra tutte le candele low partendo dall'indice trovato dall' HH
    let min = Math.min(...lowArray)

    for (let index = indexMax; index < storeData.length; ++index) {
        let tick = storeData[index];
        if (tick['low'] === min) {
            indexMin = tick['index']
            tickerFounded = tick;
        }
    }

    return {
        'min': min,
        'index': indexMin,
        'tick': tickerFounded,
    };

}

function LowerLow(storeData, indexMin, highMin, min) {

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )

    for (let index = indexMin + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (highMin < tick['high']) {

            return {
                'tickIndex': tick['index'],
                'indexMin': indexMin,
                'indexLL': tick['index'],
                'tick': tick,
            };

        } else {
            fail = true
            failIndex = index;
            break;
        }
    }

    // Pattern recognition matcher ( 2 )
    if (fail) {

        for (let index = failIndex; index <= storeData.length; ++index) {

            if (storeData[index] !== undefined) {
                let tick = storeData[index];
                if (storeData[index + 1] !== undefined) {
                    let nextTick = storeData[index + 1]
                    if (tick['high'] < nextTick['high']) {

                        console.log("Seconda condizione confermata LL")

                        return {
                            'tickIndex': nextTick['index'],
                            'indexMin': indexMin,
                            'indexLL': nextTick['index'],
                            'tick': tick
                        };

                    }
                }
            }
        }
    }

    return -1;
}

function HigherHigh(storeData, indexMax, lowMax, max) {

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )
    for (let index = indexMax + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (lowMax > tick['low']) {

            return {
                'tickIndex': tick['index'],
                'indexMax': indexMax,
                'indexHH': tick['index'],
                'tick': tick
            };

        } else {
            fail = true
            failIndex = index;
            break;
        }
    }

    // Pattern recognition matcher ( 2 )

    if (fail) {

        for (let index = failIndex; index <= storeData.length; ++index) {

            if (storeData[index] !== undefined) {
                let tick = storeData[index];
                if (storeData[index + 1] !== undefined) {
                    let nextTick = storeData[index + 1]
                    if (tick['low'] > nextTick['low']) {

                        console.log("Seconda condizione confermata HH")
                        return {
                            'tickIndex': nextTick['index'],
                            'indexMax': indexMax,
                            'indexHH': nextTick['index'],
                            'tick': tick
                        };

                    }
                }
            }
        }
    }

    return -1;
}

function patternMatching(storeData) {

    // Calcola il massimo (il valore high piu' alto di tutti tra le candele arrivate da binance)
    let maxTickHighVariable = MaxTickHigh(storeData);
    // Valore del massimo trovato tra tutte le candele arrivate da binance (high)
    let max = maxTickHighVariable['max']
    // Low del massimo trovato
    let lowMax = maxTickHighVariable['tick']['low']
    // Indice della candela del massimo
    let indexMax = maxTickHighVariable['index']

    console.log("----- MASSIMO ----------- ")
    console.log(new Date().toString())
    console.log(indexMax)
    console.log(max)
    console.log(lowMax)

    let HH = HigherHigh(storeData, indexMax, lowMax, max)

    if (HH !== -1) {

        fibonacciPointMax = HH['tick']['high'];

        console.log(new Date().toString())
        console.log("TROVATO HH")
        console.log(HH)

        let minTickLowVariable = MinTickLow(storeData, HH['indexHH']);
        let min = minTickLowVariable['min']
        let highMin = minTickLowVariable['tick']['high']
        let indexMin = minTickLowVariable['index']

        console.log("----- MINIMO ----------- ")
        console.log(indexMin)
        console.log(min)
        console.log(highMin)

        let LL = LowerLow(storeData, indexMin, highMin, min)

        if (LL !== -1) {

            console.log("TROVATO LL")
            console.log(new Date().toString())
            console.log(LL)

            fibonacciPointMin = LL['tick']['low']

            let maxTickHighVariable = MaxTickHigh(storeData, LL['indexLL']);
            let lowMax = maxTickHighVariable['tick']['low']
            let LH = HigherHigh(storeData, LL['indexLL'], lowMax, max)


            // HO TROVATO LOWER HIGH
            if (LH !== -1) {

                console.log("TROVATO LH")
                console.log(LH)
                console.log(new Date().toString())

                entryPrice = LH['tick']['high'];

                let minTickLowVariable = MinTickLow(storeData, LH['indexHH']);
                let min = minTickLowVariable['min']
                let highMin = minTickLowVariable['tick']['high']
                let HL = LowerLow(storeData, LH['indexHH'], highMin, min)

                if (HL !== -1) {

                    stopLoss = HL['tick']['low']

                    console.log(new Date().toString())
                    console.log("TROVATO HL")
                    console.log(HL)

                    return true
                }
            }
        }
    }

    return false;
}


binance.websockets.candlesticks(['SANDBUSD'], "1m", (candlesticks) => {

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

    // - Controlla il Ticker sempre a chiusura
    if (isFinal) {


        storeData.push({
            'index': tickCounter,
            'symbol': symbol,
            'open': parseFloat(open),
            'close': parseFloat(close),
            'low': parseFloat(low),
            'high': parseFloat(high),
            'volume': volume,
            'interval': interval,
            'time': new Date().toString()
        });

        if (ispatternMatching === false) {
            if (patternMatching(storeData)) {
                ispatternMatching = true;
                console.log("PATTERN FOUND")
            } else {
                console.log("----------------")
                console.log("SCANNING for found HH | LL | LH | HL | .... " + symbol)
                console.log("CERCO IL PATTERN")
                console.log("----------------")
            }
        } else {

            const fib = getFibRetracement({levels: {0: fibonacciPointMax, fibonacciPointMin: 0}});
            console.log(fib)

            /*
            JSON body
            {
                "action": "{{strategy.order.action}}",
                "exchange": "{{exchange}}",
                "ticker": "{{ticker}}",
                "asset": "BUSD" / or "USDT"
            }
             */

            if (buy === false) {

                if (parseFloat(close) > entryPrice * 1.015) {
                    console.log("HO COMPRATO")
                    ispatternMatching = false;
                    buy = true

                    //CHiamo api spot trading view
                }
            } else {

                if (parseFloat(close) < stopLoss) {
                    console.log("HO PERSO")
                    ispatternMatching = false;
                    //CHiamo api spot trading view
                }
            }
        }


        tickCounter++;
    }

});
