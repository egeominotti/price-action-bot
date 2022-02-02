const Bot = require("../models/bot");
const cors = require('cors')
const express = require("express");
const app = express();

app.use(cors());
const port = 3000;
app.listen(port)

app.get('/info', (req, res) => {
    let obj = {
        'balance': variableBalance,
        'sizeTrade': sizeTrade,
        'tradeEnabled': tradeEnabled,
        'telegramEnabled': telegramEnabled,
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

app.get('/trade/emergency', async (req, res) => {

    for (let time of timeFrame) {
        for (const token of coinsArray) {
            let key = token + "_" + time
            if (recordPattern[key] !== null) {
                if (tradeEnabled) {
                    for (let objBinance in arrObjectInstanceBinance) {
                        objBinance.balance((error, balances) => {
                            if (error) return console.error(error);
                            //console.log(exchangeInfoArray[token])
                            let sellAmount = binance.roundStep(balances[token].available, exchangeInfoArray[token].stepSize);
                            binance.marketSell(token, sellAmount);
                        });
                    }
                }
            }
        }
    }
    res.send({'stop_all': true});

});


app.get('/trade/entry', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.entryArray);
});

app.get('/trade/takeprofit', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.takeProfitArray);
});

app.get('/trade/stoploss', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.stopLossArray);
});

app.get('/tokenArray', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.tokenArray);
});

app.get('/exchangeInfoArray', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.exchangeInfoArray);
});

app.get('/getExclusionList', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.exclusionList);
});

app.get('/getEntryCoins', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.entryCoins);
});

app.get('/getRecordPattern', async (req, res) => {
    const dbData = await Bot.findOne({name: keyDbModel});
    res.send(dbData.recordPattern);
});
