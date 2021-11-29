const Kucoin = require("kucoin-websocket-api")
const api = require('kucoin-node-api')

const config = {
  apiKey: 'xXXXXXXXXXXXXXXXXXXXXxxxxxxxxxxxxxxxxxxxxxXXX',
  secretKey: 'xxxxxxxxXXXXXXXXXXXXXxxXXXXXXXXXXXXXxxxXXX',
  passphrase: 'xxxxxx',
  environment: 'test'
}

api.init(config)
const client = new Kucoin()

console.log(api.getAllTickers(function(response){
  console.log(response)
}));
// Maximum 100 Symbol / Connection!
const symbols = ["BTC-USDT", "ETH-BTC"]

// Public streaming websocket for the orderbook of the provide symbol(s)
api.initSocket({topic: "orderbook", symbols: ['KCS-BTC']}, (msg) => {
  let data = JSON.parse(msg)
  console.log(data)
})

// Private streaming websocket for account balances
api.initSocket({topic: "balances"}, (msg) => {
  let data = JSON.parse(msg)
  console.log(data)
})
