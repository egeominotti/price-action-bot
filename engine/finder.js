const Telegram = require("../utility/telegram");
const Binance = require('node-binance-api');
const Indicators = require('../indicators/ema');
const Exchange = require("../exchange/binance");
const redis = require('redis');

const client = redis.createClient();

client.connect();
client.flushAll('ASYNC');
client.on('error', (err) => {
    console.log(err)
    console.log('Error occured while connecting or accessing redis server');
});

/**
 * Finder: Si occupa di selezionare tutte le pair la cui ema(5) sul giornaliero è sotto il prezzo
 * quindi possibile candidata alla sezione. La chiave viene scritta su redis
 */
Exchange.exchangeInfo().then(async (listPair) => {

    new Binance().websockets.candlesticks(listPair, '1d', async (candlesticks) => {
        let {e: eventType, E: eventTime, s: symbol, k: ticks} = candlesticks;
        let {
            c: close,
            x: isFinal,
        } = ticks;

        let currentClose = parseFloat(close)

        if (isFinal) {

            Indicators.emaWithoutCache(symbol, '1d', 5, 150)

                .then(async (ema) => {

                    if (!isNaN(ema)) {
                        if (currentClose > ema) {
                            let obj = JSON.stringify({'ema': ema, 'pair': symbol})
                            await client.set(symbol, obj);
                            console.log(obj)
                        } else {
                            await client.del(symbol);
                        }
                    }

                }).catch(() => {
            })
        }
    });

}).catch((err) => {
    console.log(err)
});

