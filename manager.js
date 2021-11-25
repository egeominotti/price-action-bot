const {spawn} = require("child_process");
const Binance = require("node-binance-api");
const binance = new Binance();
const fs = require("fs");


binance.exchangeInfo(function (error, data) {

    let symbolData = {};

    for (let obj of data.symbols) {

        if (obj.status === 'TRADING' && obj.quoteAsset === 'USDT') {

            let filters = {status: obj.status};
            for (let filter of obj.filters) {
                if (filter.filterType == "MIN_NOTIONAL") {
                    filters.minNotional = filter.minNotional;
                } else if (filter.filterType == "PRICE_FILTER") {
                    filters.minPrice = filter.minPrice;
                    filters.maxPrice = filter.maxPrice;
                    filters.tickSize = filter.tickSize;
                } else if (filter.filterType == "LOT_SIZE") {
                    filters.stepSize = filter.stepSize;
                    filters.minQty = filter.minQty;
                    filters.maxQty = filter.maxQty;
                }
            }

            filters.baseAssetPrecision = obj.baseAssetPrecision;
            filters.quoteAssetPrecision = obj.quoteAssetPrecision;
            symbolData[obj.symbol] = filters;
        }
    }
    fs.writeFile("symbols.json", JSON.stringify(symbolData, null, 4), function (err) {
    });

});

let timeFrame = [
    '5m',
    '15m',
    '1h',
    '4h',
    '8h',
    '1D',
    '3D',
    '1W',
]


for (let time of timeFrame) {

    const bot = spawn('node', ['bot.js', time]);
    bot.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });

    bot.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    bot.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
}


