const Binance = require('node-binance-api');

const binance = new Binance().options({
    APIKEY: '<key>',
    APISECRET: '<secret>'
});


let storeData = []
let tickCounter = 0

function MaxTickHigh(storeData) {

    let idMaxTickHigh;
    let tickerFounded;
    let highArray = [];

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
                'indexMin': indexMin,
                'indexLL': index
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
                            'indexMin': indexMin,
                            'indexLL': index
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
                'indexMax': indexMax,
                'indexHH': index - 1
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
                            'indexMax': indexMax,
                            'indexHH': index - 1
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
    console.log(indexMax)
    console.log(max)
    console.log(lowMax)

    let HH = HigherHigh(storeData, indexMax, lowMax)

    if (HH !== -1) {

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
            console.log(LL)
        }
    }

    //HigherHigh(storeData)
    // let HH = HigherHigh(storeData);
    //
    // if (HH !== -1) {
    //
    //     console.log("Founded HH")
    //     console.log(HH)
    //     console.log(HH['indexHH'])
    //
    //     let LL = LowerLow(storeData, HH['indexHH'])
    //
    //     if (LL !== -1) {
    //
    //         console.log("Founded LL")
    //         console.log(LL['indexLL'])
    //         console.log(LL)
    //     }
    // }

    // if (HH !== -1) {
    //     console.log("TROVATO HH")
    //     console.log(HH)
    //     let LL = LowerLow(storeData);
    //
    //     if (LL !== -1) {
    //
    //         console.log("TROVATO LL")
    //         console.log(LL)
    //
    //         let maxTickHighVariable = MaxTickHigh(storeData);
    //         let LH = -1
    //         if (maxTickHighVariable['max'] < HH['high']) {
    //             LH = HigherHigh(storeData);
    //         }
    //
    //         if (LH !== -1) {
    //
    //             let HL = -1;
    //             let minTickLowVariable = MinTickLow(storeData);
    //             if (minTickLowVariable['min'] > LL['low']) {
    //                 HL = LowerLow(storeData);
    //             }
    //             if (HL !== -1) {
    //                 console.log("PATTERN FOUND")
    //                 return true
    //             }
    //         }
    //     }
    // }
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

        //console.log("SCANNING for found HH | LL | LH | HL | .... " + symbol)

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

        patternMatching(storeData)
        tickCounter++;
    }

});
