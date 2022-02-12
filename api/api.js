const express = require("express");
const cors = require("cors");
const Exchange = require("../exchange/binance");
const Algorithms = require('../algorithm/algorithm');
const Binance = require("node-binance-api");
const app = express();
const port = 3000;

app.use(cors());
app.listen(port);

app.get('/info', (req, res) => {
    let obj = {
        'balance': variableBalance,
        'initialBalance': balance,
        'sizeTrade': sizeTrade,
        'tradeEnabled': tradeEnabled,
        'telegramEnabled': telegramEnabled,
        'floatingperc': totalFloatingPercValue,
        'floating': totalFloatingValue,
        'floatingbalance': totalFloatingBalance,
        'uptime': 0,
    }
    res.send(obj);
});

app.get('/trade/enableTrade', async (req, res) => {
    tradeEnabled = true;
    res.send({'trade': tradeEnabled});
});

app.get('/trade/disableTrade', async (req, res) => {
    tradeEnabled = false;
    res.send({'trade': tradeEnabled});
});

app.get('/notify/enableTelegram', async (req, res) => {
    telegramEnabled = true;
    res.send({'trade': telegramEnabled});
});

app.get('/trade/disableTelegram', async (req, res) => {
    telegramEnabled = false;
    res.send({'trade': telegramEnabled});
});

app.get('/trade/stop', async (req, res) => {

    try {

        for (let time of timeFrame) {
            for (const token of finder) {
                console.log(token)
                let key = token + "_" + time
                if (entryCoins[key] === true) {
                    Exchange.sell(token);
                    Algorithms.decreasePosition(key);
                }
            }
        }

    } catch (e) {
        console.log(e);
    }

    res.send({'stop_all': true});

});

app.get('/trade/entry', async (req, res) => {
    res.send(entryArray);
});

app.get('/trade/takeprofit', async (req, res) => {
    res.send(takeProfitArray);
});

app.get('/trade/stoploss', async (req, res) => {
    res.send(stopLossArray);
});

app.get('/tokenArray', async (req, res) => {
    res.send(tokenArray);
});

app.get('/exchangeInfoArray', async (req, res) => {
    res.send(exchangeInfoArray);
});

app.get('/getExclusionList', async (req, res) => {
    res.send(exclusionList);
});

app.get('/getEntryCoins', async (req, res) => {
    res.send(entryCoins);
});

app.get('/getRecordPattern', async (req, res) => {
    res.send(recordPattern);
});
