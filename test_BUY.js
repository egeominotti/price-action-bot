const Binance = require('node-binance-api');
const User = require('./models/user');
const coins = require('./utility/coins');

const binance = new Binance().options({
    APIKEY: 'g4m5LHCwMI1evVuaf6zgKXtszDnSboQla5O5c7uWVtBmdbaiTLNQWPnO9ImbYB9U',
    APISECRET: 'b2kxHirJLXDrXuFGvLWUtXvRyUXQu4NvsY8lSy94bJjnJFn0SmESuBq60DJi9b0B'
});


let tokenArray = {}
let indexArray = {}
let recordPattern = {}

let coinsArray = coins.getCoins()
let timeFrame = [
    '5m',
    '15m',
    '1h',
    '4h',
    '1d',
    '3d',
    '1w',
]


for (let time of timeFrame) {
    for (const token of coinsArray) {
        let key = token + "_" + time
        indexArray[key] = -1;
        tokenArray[key] = [];
        recordPattern[key] = [];
    }
}

//minQty = minimum order quantity
//minNotional = minimum order value (price * quantity)
binance.exchangeInfo(function (error, data) {

        for (let obj of data.symbols) {

            if (coinsArray.indexOf(obj.symbol) !== -1) {
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
                filters.orderTypes = obj.orderTypes;
                filters.icebergAllowed = obj.icebergAllowed;
                tokenArray[obj.symbol] = filters;

            }

        }

        console.log(tokenArray)
        console.log("FINITO");

        binance.prices('ETHUSDT', (error, ticker) => {
            console.info("Price of BNB: ", ticker.ETHUSDT);
            let amount = binance.roundStep(200 / ticker.ETHUSDT, tokenArray['ETHUSDT'].stepSize);
            //binance.marketBuy('ETHUSDT', amount);

            binance.marketSell('ETHUSDT', amount);

        });

    }
);
//

//
//

