const mongoose = require('mongoose');
const Schema = mongoose.Schema

const botSchema = new Schema({
    closeEntryVariations:   {type: Number, required: false},
    stopLossVariations:     {type: Number, required: false},
    takeProfitVariations:   {type: Number, required: false},
});

module.exports = mongoose.model('Bot', botSchema)
