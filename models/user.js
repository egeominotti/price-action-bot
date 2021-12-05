const mongoose = require('mongoose');
const Schema = mongoose.Schema

const usersSchema = new Schema({
    name: {type: String, required: false},
    api_key: {type: String, required: false},
    api_secret: {type: String, required: false},
    telegram_token: {type: String, required: false},
    telegram_chat_id: {type: String, required: false},
});

// https://www.npmjs.com/package/node-mongoose-fixtures

module.exports = mongoose.model('User', usersSchema)
