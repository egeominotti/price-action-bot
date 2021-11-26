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
            console.log(error)
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
            highArray.push(tick['high'])
        }

        let max = Math.max(...highArray)

        for (let index = startIndex; index < storeData.length; ++index) {
            let tick = storeData[index];
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


function HigherHigh(storeData) {

    let fail = false
    let failIndex;

    let max = MaxTickHigh(storeData);
    let low = max['tick']['low']
    let close = max['tick']['close']
    let maxIndex = max['index']


    // Pattern recognition matcher ( 1 )
    for (let index = maxIndex + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (tick['low'] < low && tick['close'] < close) {
            return {
                'index': index,
                'value': max['max']
            };

        } else {
            fail = true
            failIndex = index;
            break;
        }
    }

    if (fail) {

        for (let index = failIndex; index <= storeData.length; ++index) {

            if (storeData[index] !== undefined) {
                let tick = storeData[index];
                if (storeData[index + 1] !== undefined) {
                    let nextTick = storeData[index + 1]
                    if (nextTick['low'] < tick['low'] && nextTick['close'] < tick['close']) {

                        return {
                            'index': index,
                            'value': max['max']
                        };

                    }
                }
            }
        }
    }

    return -1;
}

function LowerLow(storeData, indexHigherHigh) {

    let min = MinTickLow(storeData, indexHigherHigh);
    let high = min['tick']['high']
    let close = min['tick']['close']

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )
    for (let index = indexHigherHigh + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (tick['high'] > high && tick['close'] > close) {

            return {
                'index': index,
                'value': min['min']
            };

        } else {
            fail = true
            failIndex = index;
            break;
        }
    }

    if (fail) {

        for (let index = failIndex; index <= storeData.length; ++index) {

            if (storeData[index] !== undefined) {
                let tick = storeData[index];
                if (storeData[index + 1] !== undefined) {
                    let nextTick = storeData[index + 1]
                    if (nextTick['high'] > tick['high'] && nextTick['close'] > tick['close']) {

                        return {
                            'index': index,
                            'value': min['min']
                        };

                    }
                }
            }
        }
    }

    return -1;
}

function LowerHigh(storeData, indexLowerLow) {


    let max = MaxTickHigh(storeData, indexLowerLow);
    let close = max['tick']['close']
    let low = max['tick']['low']

    for (let index = indexLowerLow + 1; index < storeData.length; index++) {

        let currentTick = storeData[index];
        if (currentTick['low'] < low && currentTick['close'] < close) {
            return {'index': index, 'value': max['max']};
        }
    }

    return -1;
}

function HigherLow(storeData, indexLowerHigh) {


    let min = MinTickLow(storeData, indexLowerHigh);
    let close = min['tick']['close']
    let high = min['tick']['high']

    for (let index = indexLowerHigh + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (tick['high'] > high && tick['close'] > close) {
            return {'index': index, 'value': min['min']};
        }
    }

    return -1;
}

function patternMatching(storeData) {

    if (storeData.length > 2) {

        let HH = HigherHigh(storeData)

        if (HH !== -1) {

            let LL = LowerLow(storeData, HH['index'])

            if (LL !== -1) {

                let LH = LowerHigh(storeData, LL['index'])

                if (LH !== -1) {

                    let HL = HigherLow(storeData, LH['index'])

                    let lastTicker;
                    for (let currentTicker of storeData) {
                        lastTicker = currentTicker;
                    }

                    if (lastTicker['close'] > LH['tick']['high']) {

                        let entryPrice = LH['value'];
                        let takeProfit = LH['value'] + (HH['value'] - LL['value'])

                        return {
                            'patternFoundTime': new Date().toISOString(),
                            'TAKE_PROFIT': takeProfit,
                            'ENTRY_PRICE': entryPrice,
                            'STOP_LOSS': LL['value'],
                            'HH': HH['value'],
                            'LL': LL['value'],
                            'LH': LH['value'],
                            'HL': HL['value']
                        }
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
