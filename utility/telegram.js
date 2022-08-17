const axios = require("axios");
require('dotenv').config();


const telegram = 'https://api.telegram.org/bot'
    + process.env.BOT_TOEKN + '/sendMessage?chat_id='
    + process.env.CHAT_ID + '&parse_mode=Markdown&text='


function sendMessage(text) {

    axios.get(telegram + text)
        .then(function (response) {
        })
        .catch(function (error) {
            console.log(error)
        })
}

module.exports = {
    sendMessage
}
