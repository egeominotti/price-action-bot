const mongoose = require('mongoose');
const Logger = require('../models/logger');
const _ = require("lodash");
require('dotenv').config();

mongoose.connect(process.env.URI_MONGODB);

const sizeOnceTrade = 200
let balance = 5000 // dollar
let sumSizeTrade = 0;

Logger.find({}, function (err, result) {
    if (err) {
        console.log(err);
    } else {
        if (result.length > 0) {
            for (let record of result) {

                let finaleTradeValue;
                let sizeTrade = sizeOnceTrade
                let entryprice = record.entryprice
                let stopLossPercentage = record.stoplosspercentage
                let stopLossValue = record.stoplossvalue;
                let takeprofitpercentage = record.takeprofitpercentage
                let takeprofitvalue = record.takeprofitvalue


                if (record.type === 'STOPLOSS') {
                    let finaleSizeTrade = (sizeTrade / entryprice) * stopLossValue;
                    finaleTradeValue = finaleSizeTrade - sizeTrade
                }

                if (record.type === 'TAKEPROFIT') {
                    let finaleSizeTrade = (sizeTrade / entryprice) * takeprofitvalue;
                    finaleTradeValue = finaleSizeTrade - sizeTrade
                }

                sumSizeTrade += finaleTradeValue;
                console.log(sumSizeTrade)
            }

            let endBalance = _.round(balance + sumSizeTrade, 2)
            console.log("Finale Balance: " + endBalance)

        }
    }
});
