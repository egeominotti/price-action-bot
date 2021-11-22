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

    console.log("Founded Max Tick Value: " + max)

    return {
        'max': max,
        'index': idMaxTickHigh,
        'tick': tickerFounded,
    };
}

function MinTickLow(storeData, indexMax) {

    let tickerFounded;
    let lowArray = [];

    for (let index = indexMax; index < storeData.length; ++index) {
        let tick = storeData[index];
        lowArray.push((tick['low']))
    }

    // Trovo il minimo tra tutte le candele low partendo dall'indice trovato dall' HH
    let min = Math.min(...lowArray)

    for (let index = indexMax; index < storeData.length; ++index) {
        let tick = storeData[index];
        if (tick['low'] === min) {
            index = tick['index']
            tickerFounded = tick;
        }
    }

    return {
        'min': min,
        'index': indexMax,
        'tick': tickerFounded,
    };
}

function LowerLow(storeData, indexHH) {

    let minTickLowVariable = MinTickLow(storeData, indexHH);
    let highMin = minTickLowVariable['tick']['high']
    //let indexMin = minTickLowVariable['index']

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )

    for (let index = indexHH; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (highMin < tick['high']) {

            return {
                'indexLL': index,
                'minTickHighVariable': minTickLowVariable
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
                            'indexLL': index,
                            'minTickHighVariable': minTickLowVariable
                        };

                    }
                }
            }
        }
    }

    return -1;
}

function HigherHigh(storeData) {

    let maxTickHighVariable = MaxTickHigh(storeData);
    let lowMax = maxTickHighVariable['tick']['low']
    let indexMax = maxTickHighVariable['index']

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )
    for (let index = indexMax + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (lowMax > tick['low']) {

            return {
                'indexHH': index,
                'maxTickHighVariable': maxTickHighVariable,
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
                            'indexHH': index,
                            'maxTickHighVariable': maxTickHighVariable
                        };

                    }
                }
            }
        }

    }

    return -1;
}

function patternMatching(storeData) {

    let HH = HigherHigh(storeData);

    if (HH !== -1) {

        console.log("Founded HH")
        console.log(HH)
        console.log(HH['indexHH'])

        let LL = LowerLow(storeData, HH['indexHH'])

        if (LL !== -1) {

            console.log("Founded LL")
            console.log(LL['indexLL'])
            console.log(LL)
        }
    }

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

        console.log("SCANNING for found HH | LL | LH | HL | .... " + symbol)

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
