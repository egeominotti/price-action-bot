const Binance = require('node-binance-api');
const {getFibRetracement, levels} = require('fib-retracement');

const binance = new Binance().options({
    APIKEY: '<key>',
    APISECRET: '<secret>'
});


let storeData = []
let tickCounter = 0

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

function LowerLow(storeData, indexMin, highMin) {

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )

    for (let index = indexMin + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (highMin < tick['high']) {

            return {
                'tickIndex': tick['index'],
                'indexMin': indexMin,
                'indexLL': index,
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

        for (let index = failIndex; index < storeData.length; ++index) {

            if (storeData[index] !== undefined) {
                let tick = storeData[index];
                if (storeData[index + 1] !== undefined) {
                    let nextTick = storeData[index + 1]
                    if (tick['high'] < nextTick['high']) {

                        console.log("Seconda condizione confermata LL")
                        return {
                            'tickIndex': tick['index'],
                            'indexMin': indexMin,
                            'indexLL': index,
                            'tick': tick
                        };

                    }
                }
            }
        }
    }

    return -1;
}

function HigherHigh(storeData, indexMax, lowMax) {

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )
    for (let index = indexMax + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (lowMax > tick['low']) {

            return {
                'tickIndex': tick['index'],
                'indexMax': indexMax,
                'indexHH': index - 1,
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

        for (let index = failIndex; index < storeData.length; ++index) {

            if (storeData[index] !== undefined) {
                let tick = storeData[index];
                if (storeData[index + 1] !== undefined) {
                    let nextTick = storeData[index + 1]
                    if (tick['low'] > nextTick['low']) {

                        console.log("Seconda condizione confermata HH")
                        return {
                            'tickIndex': tick['index'],
                            'indexMax': indexMax,
                            'indexHH': index - 1,
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

    let HH = HigherHigh(storeData, indexMax, lowMax)

    if (HH !== -1) {
        console.log(new Date().toString())
        console.log("TROVATO HH")
        console.log(HH)

        // Calcola il minimo (il valore low piu' basso di tutti tra le candele arrivate da binance)
        let minTickLowVariable = MinTickLow(storeData, HH['indexHH']);
        // Valore del minimo trovato tra tutte le candele arrivate da binance ( low )
        let min = minTickLowVariable['min']
        // High del valore minimo trovato
        let highMin = minTickLowVariable['tick']['high']
        // Indice della candela del minimo
        let indexMin = minTickLowVariable['index']

        console.log("----- MINIMO ----------- ")
        console.log(indexMin)
        console.log(min)
        console.log(highMin)

        let LL = LowerLow(storeData, indexMin, highMin)

        if (LL !== -1) {

            console.log("TROVATO LL")
            console.log(new Date().toString())
            console.log(LL)

            let maxTickHighVariable = MaxTickHigh(storeData, LL['indexLL']);
            let lowMax = maxTickHighVariable['tick']['low']
            let LH = HigherHigh(storeData, LL['indexLL'], lowMax)


            // HO TROVATO LOWER HIGH
            if (LH !== -1) {

                console.log("TROVATO LH")
                console.log(LH)
                console.log(new Date().toString())

                let minTickLowVariable = MinTickLow(storeData, LH['indexHH']);
                let highMin = minTickLowVariable['tick']['high']
                let HL = LowerLow(storeData, LH['indexHH'], highMin)

                if (HL !== -1) {
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

        if (patternMatching(storeData)) {
            console.log("PATTERN FOUND")
        } else {
            console.log("----------------")
            console.log("SCANNING for found HH | LL | LH | HL | .... " + symbol)
            console.log("CERCO IL PATTERN")
            console.log("----------------")
        }
        tickCounter++;
    }

});
