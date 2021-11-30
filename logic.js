const axios = require('axios');
const _ = require('lodash');
const bot_token = '1889367095:AAGS13rjA6xWAGvcUTOy1W1vUZvPnNxcDaw'
const bot_chat_id = '-558016221'


/**
 *
 * @param text
 */
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

/**
 *
 * @param storeData
 * @param startIndex
 * @returns {{max: number, index, tick}}
 * @constructor
 */
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

/**
 *
 * @param storeData
 * @param indexMax
 * @returns {{min: number, index, tick}}
 * @constructor
 */
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

/**
 *
 * @param storeData
 * @returns {{index: (*), value: number}|number}
 * @constructor
 */
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
                'index': maxIndex,
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
                            'index': maxIndex,
                            'value': max['max']
                        };

                    }
                }
            }
        }
    }

    return -1;
}

/**
 *
 * @param storeData
 * @param indexHigherHigh
 * @returns {{index, value: number}|number}
 * @constructor
 */
function LowerLow(storeData, indexHigherHigh) {

    let min = MinTickLow(storeData, indexHigherHigh);
    let high = min['tick']['high']
    let close = min['tick']['close']
    let minIndex = min['tick']['index']

    let fail = false
    let failIndex;

    // Pattern recognition matcher ( 1 )
    for (let index = indexHigherHigh + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (tick['high'] > high && tick['close'] > close) {

            return {
                'index': minIndex,
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
                            'index': minIndex,
                            'value': min['min']
                        };

                    }
                }
            }
        }
    }

    return -1;
}

/**
 *
 * @param storeData
 * @param indexLowerLow
 * @returns {{index, value: number}|number}
 * @constructor
 */
function LowerHigh(storeData, indexLowerLow) {

    let max = MaxTickHigh(storeData, indexLowerLow);
    let close = max['tick']['close']
    let low = max['tick']['low']
    let maxIndex = max['tick']['index']


    for (let index = indexLowerLow + 1; index < storeData.length; index++) {

        let currentTick = storeData[index];
        if (currentTick['low'] < low && currentTick['close'] < close) {

            return {
                'index': maxIndex,
                'value': max['max']
            };
        }
    }

    return -1;
}

/**
 *
 * @param storeData
 * @param indexLowerHigh
 * @param maxLowerHigh
 * @returns {{index, value: number}|number}
 * @constructor
 */
function HigherLow(storeData, indexLowerHigh, maxLowerHigh) {

    let min = MinTickLow(storeData, indexLowerHigh);
    let close = min['tick']['close']
    let high = min['tick']['high']
    let minIndex = min['tick']['index']

    for (let index = indexLowerHigh + 1; index < storeData.length; ++index) {

        let tick = storeData[index];
        if (tick['high'] > high && tick['close'] > close && high < maxLowerHigh) {

            return {
                'index': minIndex,
                'value': min['min']
            };
        }
    }

    return -1;
}

/**
 *
 * @param storeData
 * @param symbol
 * @returns {boolean|{hh, ll, hl, stoploss: number, takeprofit: *, lh, entryprice}}
 */
function patternMatching(storeData, symbol) {


    let HH = HigherHigh(storeData)

    if (HH !== -1) {

        let LL = LowerLow(storeData, HH['index'])

        if (LL !== -1) {

            let LH = LowerHigh(storeData, LL['index'])

            if (LH !== -1) {

                let HL = HigherLow(storeData, LH['index'], LH['value'])

                if (HL !== -1) {

                    let lastTicker;
                    for (let currentTicker of storeData) lastTicker = currentTicker;

                    let entryPrice = LH['value'];
                    let takeProfit = LH['value'] + (HH['value'] - LL['value'])

                    return {
                        'takeprofit': takeProfit,
                        'entryprice': entryPrice,
                        'stoploss': HL['value'] * 0.9980,
                        'hh': HH['value'],
                        'll': LL['value'],
                        'lh': LH['value'],
                        'hl': HL['value']
                    }

                }
            }
        }
    }

    return false;
}

/**
 *
 * @param symbol
 * @param interval
 * @param close
 * @param isTelegramEnabled
 * @param tradeEnabled
 * @param apiUrlTrade
 * @param recordPatternValue
 */
function strategyBreakout(symbol, interval, close, isTelegramEnabled, tradeEnabled, apiUrlTrade, recordPatternValue) {

    let closeIncreased = close * 1.0023
    let takeprofit = recordPatternValue['takeprofit']
    let stoploss = recordPatternValue['stoploss']
    let hh = recordPatternValue['hh']
    let ll = recordPatternValue['ll']
    let lh = recordPatternValue['lh']
    let hl = recordPatternValue['hl']

    // 1) Strategy - Breakout
    if (closeIncreased > recordPatternValue['lh']) {

        let entrypricedate = new Date()
        // const fib = fibonacci.fibonacciRetrecement({
        //     levels: {
        //         0: recordPatternValue['hh'],
        //         1: recordPatternValue['ll']
        //     }
        // })
        // console.log(fib)

        if (tradeEnabled) {

            let body = {
                action: 'BUY',
                exchange: 'BINANCE',
                ticker: symbol,
                asset: 'USDT',
            }

            axios.post(apiUrlTrade, body)
                .then(function (response) {
                    console.log(response);
                })
                .catch(function (error) {
                    console.log(error);
                });
        }

        if (isTelegramEnabled) {

            let message = "Symbol: " + symbol + "\n" +
                "Interval: " + interval + "\n" +
                "Entry found at: " + entrypricedate.toUTCString() + "\n" +
                "takeprofit: " + takeprofit + "\n" +
                "stoploss:  " + stoploss + "\n" +
                "hh: " + hh + "\n" +
                "ll: " + ll + "\n" +
                "lh: " + lh + "\n" +
                "hl: " + hl

            sendMessageTelegram(message)
        }

        recordPatternValue['confirmed'] = true
        recordPatternValue['entryprice'] = closeIncreased
        recordPatternValue['entrypricedate'] = entrypricedate
    }
}

module.exports = {
    patternMatching, strategyBreakout, sendMessageTelegram
}
