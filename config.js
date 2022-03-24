const Binance = require('node-binance-api');

global.binance = new Binance().options({
    useServerTime: true,
    recvWindow: 10000,
    log: log => {
        console.log(log);
    }
});


global.timeFrame = [
    '1m',
    '5m',
    '15m',
    '1h',
    '4h',
    '1d',
];


global.finder = [];

global.balance = 2400;
global.sizeTrade = 200;
global.maxEntry = (balance / sizeTrade) - 1
global.telegramEnabled = true;
global.tradeEnabled = false;

global.variableBalance = 0;
global.totalPercentage = 0
global.sumSizeTrade = 0;
global.totalFloatingValue = 0;
global.totalFloatingPercValue = 0;
global.totalFloatingBalance = 0;
global.totalEntry = 0;

global.listEntry = {};
global.emaArray = {};
global.floatingPercArr = {};
global.floatingArr = {};
global.tokenArray = {}
global.exchangeInfoArray = {}
global.indexArray = {}
global.recordPattern = {}
global.exclusionList = {}
global.entryCoins = {}
global.takeProfitArray = {}
global.stopLossArray = {}
global.entryArray = {}
