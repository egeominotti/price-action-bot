const mongoose = require('mongoose');
const Logger = require('../models/logger');
const _ = require("lodash");
require('dotenv').config();

mongoose.connect(process.env.URI_MONGODB);

let balance = 5000 // dollar

Logger.find({}, function (err, result) {
    if (err) {
        console.log(err);
    } else {

        for (let record of result) {

            let sizeTrade = 200
            let entryprice = record.entryprice
            let stopLossPercentage = record.stoplosspercentage
            let takeprofitpercentage = record.takeprofitpercentage

            console.log(entryprice)
            console.log(stopLossPercentage)
            console.log(takeprofitpercentage)

            if (record.type === 'STOPLOSS') {

                let fineSizeTrade = (sizeTrade / entryprice) *

                balance = _.round((balance / entryprice) * stopLossPercentage, 2)
            }

            if (record.type === 'TAKEPROFIT') {

                sizeTrade *= stopLossPercentage

                balance = _.round((balance / entryprice) * takeprofitpercentage, 2)
            }
            console.log(balance)

        }

    }
});
