const mongoose = require('mongoose');
const Schema = mongoose.Schema

const botSchema = new Schema({
    name: {type: String, required: true},
    balance: {type: Number, required: true},
    exchangeInfoArray: {type: JSON, required: false},
    tokenArray: {type: JSON, required: false},
    indexArray: {type: JSON, required: false},
    recordPattern: {type: JSON, required: false},
    exclusionList: {type: JSON, required: false},
    entryCoins: {type: JSON, required: false},
    takeProfitArray: {type: JSON, required: false},
    stopLossArray: {type: JSON, required: false},
    entryArray: {type: JSON, required: false},
    emaArray: {type: JSON, required: false},
});

module.exports = mongoose.model('Bot', botSchema)
