// const mongoose = require('mongoose');
// const Logger = require('../models/logger');
// const Telegram = require('../utility/telegram');
// const _ = require("lodash");
// require('dotenv').config();
//
// mongoose.connect(process.env.URI_MONGODB);
//
//
// function getBalance() {
//
//     const sizeOnceTrade = 200
//     let balance = 3000 // dollars
//     let sumSizeTrade = 0;
//     let countStopLoss = 0;
//     let countTakeProfit = 0;
//
//     // each 2 hours send balance updated
//     setInterval(() => {
//         Logger.find({}, function (err, result) {
//             if (err) {
//                 console.log(err);
//             } else {
//
//                 if (result.length > 0) {
//
//                     for (let record of result) {
//
//                         let finaleTradeValue;
//                         let sizeTrade = sizeOnceTrade
//                         let entryprice = record.entryprice
//                         let stopLossValue = record.stoplossvalue;
//                         let takeprofitvalue = record.takeprofitvalue
//                         let stopLossPercentage = record.stoplosspercentage
//                         let takeprofitpercentage = record.takeprofitpercentage
//
//                         if (record.type === 'STOPLOSS') {
//                             let finaleSizeTrade = (sizeTrade / entryprice) * stopLossValue;
//                             finaleTradeValue = finaleSizeTrade - sizeTrade
//                             countStopLoss++;
//                         }
//
//                         if (record.type === 'TAKEPROFIT') {
//                             let finaleSizeTrade = (sizeTrade / entryprice) * takeprofitvalue;
//                             finaleTradeValue = finaleSizeTrade - sizeTrade
//                             countTakeProfit++;
//                         }
//
//                         sumSizeTrade += finaleTradeValue;
//                     }
//
//                     let endBalance = _.round(balance + sumSizeTrade, 2)
//                     let ratioBalance = ((endBalance - balance) / balance) * 100
//
//                     let message = "Initial Balance: " + balance + "\n" +
//                         "Balance updated: " + endBalance + "\n" +
//                         "Balance ratio: " + _.round(ratioBalance, 3) + "\n" +
//                         "Take profit count: " + countTakeProfit + "\n" +
//                         "Stop loss count: " + countStopLoss
//
//                     console.log("Final Balance: " + endBalance)
//                     Telegram.sendMessage(message)
//                 }
//             }
//         });
//     }, 7200000)
//
// }
//
// module.exports = {
//     getBalance
// }
