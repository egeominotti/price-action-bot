const {getFibRetracement, levels} = require('fib-retracement');
const axios = require('axios');
const _ = require('lodash');
const bot_token = '1889367095:AAGS13rjA6xWAGvcUTOy1W1vUZvPnNxcDaw'
const bot_chat_id = '-558016221'


function sendMessageTelegram(text) {

    const send_text = 'https://api.telegram.org/bot' + bot_token + '/sendMessage?chat_id=' + bot_chat_id + '&parse_mode=Markdown&text=' + text

    axios.get(send_text)
        .then(function (response) {
        })
        .catch(function (error) {
        })
        .then(function () {
        });

}

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

                        //console.log("Seconda condizione confermata LL")

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

                        //console.log("Seconda condizione confermata HH")
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

    let maxTickHighVariable = MaxTickHigh(storeData);
    let HH_MAX = maxTickHighVariable['max']
    let lowMax = maxTickHighVariable['tick']['low']
    let indexMax = maxTickHighVariable['index']


    let HH = HigherHigh(storeData, indexMax, lowMax, ABSOLUTE_MAX)

    if (HH !== -1) {

        let fibonacciPointMax = HH['tick']['high'];

        let minTickLowVariable = MinTickLow(storeData, HH['indexHH']);
        let HH_MIN = minTickLowVariable['min']
        let highMin = minTickLowVariable['tick']['high']
        let indexMin = minTickLowVariable['index']

        let LL = LowerLow(storeData, indexMin, highMin, HH_MIN)

        if (LL !== -1) {


            let minTickLowVariable = MinTickLow(storeData, LL['indexLL']);
            let LL_MIN = minTickLowVariable['min']

            let fibonacciPointMin = LL['tick']['low']
            let maxTickHighVariable = MaxTickHigh(storeData, LL['indexLL']);
            let lowMax = maxTickHighVariable['tick']['low']

            let LH = HigherHigh(storeData, LL['indexLL'], lowMax, HH_MAX)
            let fib = getFibRetracement({levels: {0: fibonacciPointMax, 1: fibonacciPointMin}});

            if (LH !== -1) {

                let entryPrice = LH['tick']['high'];

                let minTickLowVariable = MinTickLow(storeData, LH['indexHH']);
                let LH_MIN = minTickLowVariable['min']
                let highMin = minTickLowVariable['tick']['high']
                let HL = LowerLow(storeData, LH['indexHH'], highMin, LH_MIN)

                if (HL !== -1) {

                    let stopLoss = HL['tick']['low']

                    return {
                        'patternFoundTime': new Date().toISOString(),
                        'fibonacci': fib,
                        'entryPrice': entryPrice,
                        'stopLoss': stopLoss,
                        'min': min,
                        'max': max,
                        'HH': HH,
                        'LL': LL,
                        'LH': LH,
                        'HL': HL
                    }
                }
            }
        }
    }

    return false;
}

module.exports = {
    patternMatching, sendMessageTelegram
}
