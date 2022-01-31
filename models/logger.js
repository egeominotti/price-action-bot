const mongoose = require('mongoose');
const Schema = mongoose.Schema

const loggerSchema = new Schema({
    type: {type: String, required: false},
    symbol: {type: String, required: false},
    interval: {type: String, required: false},
    balance: {type: String, required: false},
    entryprice: {type: String, required: false},
    entrypricedate: {type: Date, required: false},
    takeprofitvalue: {type: String, required: false},
    stoplossvalue: {type: String, required: false},
    takeprofitpercentage: {type: String, required: false},
    takeprofitdate: {type: Date, required: false},
    stoplosspercentage: {type: String, required: false},
    stoplossdate: {type: Date, required: false},
    hh: {type: String, required: false},
    ll: {type: String, required: false},
    lh: {type: String, required: false},
    hl: {type: String, required: false},
    strategy: {type: String, required: false},
});

module.exports = mongoose.model('Logger', loggerSchema)
