require('dotenv').config();

const axios = require("axios");

let bot_token = ''
let bot_chat_id = ''

if (process.env.DEBUG === 'false') {
    bot_token = '1889367095:AAGS13rjA6xWAGvcUTOy1W1vUZvPnNxcDaw'
    bot_chat_id = '-558016221'
} else {
    bot_token = '2136128892:AAFOQs6Qri5eqZKIeEovq8wthAxPYDjkBkY'
    bot_chat_id = '-699520069'
}

/**
 *
 * @param text
 */
function sendMessage(text) {

    const send_text = 'https://api.telegram.org/bot' + bot_token + '/sendMessage?chat_id=' + bot_chat_id + '&parse_mode=Markdown&text=' + text

    axios.get(send_text)
        .then(function (response) {
        })
        .catch(function (error) {
            console.log(error)
        })
        .then(function () {
        });

}

module.exports = {
    sendMessage
}
