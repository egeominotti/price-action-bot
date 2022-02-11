<template>
  <div>
    <br>
    <b-container fluid>
      <b-row>
        <b-col>
          <b-card
              title="BOTV2 metrics"
              class="custom-header-b-card"
          >
            <b-card-text class="custom-data-bot">
              Static Balance: {{ initialBalance }}$ |
              Floating Balance: {{ floatingbalance }}$ |
              Tradestatus: {{ tradeEnabled }} |
              Entry Counter: {{ counterEN }} |
              Takeprofit Counter: {{ counterTP }} |
              Stoploss Counter: {{ counterSL }} |
              TradeSize: {{ sizeTrade }}$ |
              Total floating profit/loss: {{ floating }}$ |
              Total floating profit/loss percentage: {{ floatingperc }} % |
            </b-card-text>

            <b-button v-if="entryArray.length > -1" @click="closeAllPosition()" variant="danger">Close All Position
            </b-button>
            <br>
            <br>

            <b-button v-if="tradeEnabled === false" @click="enableTrade()" class="space-increment" variant="success">
              Enable Trade
            </b-button>
            <b-button v-else @click="disableTrade()" ariant="dark">Disable Trade</b-button>

            <b-button v-if="tradeEnabled === false" @click="enableTelegram()" class="space-increment" variant="success">
              Enable Telegram
            </b-button>
            <b-button v-else @click="disbaleTelegram()" ariant="dark">Disable Telegram</b-button>

          </b-card>
        </b-col>


      </b-row>
    </b-container>
    <br>

    <b-container fluid>
      <b-row>
        <b-col>
          <b-card
              title="Entry"
              class="custom-header-b-card"
          >
            <b-card-text class="custom-font">
              <b-table hover :items="entryArray"></b-table>
            </b-card-text>

          </b-card>
        </b-col>


      </b-row>
    </b-container>

    <br>
    <b-container fluid>
      <b-row>

        <b-col>
          <b-card
              title="Takeprofit"
              class="custom-header-b-card"
          >
            <b-card-text>
              <b-table hover :items="takeProfitArray"></b-table>
            </b-card-text>

          </b-card>
        </b-col>

        <b-col>
          <b-card
              title="Stoploss"
              class="custom-header-b-card"
          >
            <b-card-text>
              <b-table hover :items="stopLossArray"></b-table>
            </b-card-text>

          </b-card>
        </b-col>

      </b-row>
    </b-container>


  </div>
</template>


<script>

const BASE_URL = 'http://188.34.189.183:3000';

export default {
  data() {
    return {
      timer: '',
      balance: 0,
      uptime: 0,
      sizeTrade: 0,
      floating: 0,
      floatingperc: 0,
      floatingbalance: 0,
      floatingBalance: 0,
      initialBalance: 0,
      tradeEnabled: false,
      telegramEnabled: false,
      token: null,
      tokenArray: null,
      exclusionListArray: [],
      counterTP: 0,
      counterSL: 0,
      counterEN: 0,
      takeProfitArray: [],
      stopLossArray: [],
      entryArray: [],
    }
  },
  methods: {

    async getData() {

      this.entryArray = [];
      this.stopLossArray = [];
      this.takeProfitArray = [];
      this.exclusionListArray = []

      const infoReq = await fetch(BASE_URL + '/info');
      const infoData = await infoReq.json();
      console.log(infoData)
      this.balance = infoData.balance;
      this.uptime = infoData.uptime;
      this.sizeTrade = infoData.sizeTrade;
      this.tradeEnabled = infoData.tradeEnabled;
      this.telegramEnabled = infoData.telegramEnabled;

      this.floatingperc = infoData.floatingperc
      this.floating = infoData.floating
      this.initialBalance = infoData.initialBalance
      this.floatingbalance = infoData.floatingbalance
      this.totalFloatingBalance = infoData.totalFloatingBalance

      const entryArrayReq = await fetch(BASE_URL + '/trade/entry');
      const entryArrayData = await entryArrayReq.json();

      for (let k in entryArrayData)
        if (entryArrayData[k] !== null) this.entryArray.push(entryArrayData[k]);

      this.entryArray = this.entryArray.sort(function (a, b) {
        return a.entrypricedate < b.entrypricedate ? 1 : a.entrypricedate > b.entrypricedate ? -1 : 0
      });

      const takeProfitArrayReq = await fetch(BASE_URL + '/trade/takeprofit');
      const takeProfitArrayData = await takeProfitArrayReq.json();
      console.log(takeProfitArrayData)
      for (let k in takeProfitArrayData)
        if (takeProfitArrayData[k] !== null) this.takeProfitArray.push(takeProfitArrayData[k]);

      this.takeProfitArray = this.takeProfitArray.sort(function (a, b) {
        return a.takeprofitdate < b.takeprofitdate ? 1 : a.takeprofitdate > b.takeprofitdate ? -1 : 0
      });


      const stopLossArrayReq = await fetch(BASE_URL + '/trade/stoploss');
      const stopLossArrayData = await stopLossArrayReq.json();

      for (let k in stopLossArrayData)
        if (stopLossArrayData[k] !== null) this.stopLossArray.push(stopLossArrayData[k]);

      this.stopLossArray = this.stopLossArray.sort(function (a, b) {
        return a.stoplossdate < b.stoplossdate ? 1 : a.stoplossdate > b.stoplossdate ? -1 : 0
      });

      this.counterEN = this.entryArray.length;
      this.counterSL = this.stopLossArray.length;
      this.counterTP = this.takeProfitArray.length;

    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },

    async closeAllPosition() {
      const res = await fetch(BASE_URL + '/trade/stop');
      const result = await res.json();
      console.log(result);
    },

    async enableTrade() {
      const res = await fetch(BASE_URL + '/trade/enableTrade');
      const result = await res.json();
      console.log(result);
      this.tradeEnabled = true;
    },

    async disableTrade() {
      const res = await fetch(BASE_URL + '/trade/disableTrade');
      const result = await res.json();
      console.log(result);
      this.tradeEnabled = false;
    },

    async enableTelegram() {
      const res = await fetch(BASE_URL + '/trade/enableTrade');
      const result = await res.json();
      console.log(result);
      this.telegramEnabled = true;
    },

    async disbaleTelegram() {
      const res = await fetch(BASE_URL + '/trade/disableTrade');
      const result = await res.json();
      console.log(result);
      this.telegramEnabled = false;
    },

  },
  mounted() {
    this.getData();
    this.timer = setInterval(this.getData, 100000);
  },

  beforeDestroy() {
    this.cancelAutoUpdate();
  }

}
</script>

<style scoped>

div {
  font-size: 14px;
}

p.card-text.custom-data-bot {
  font-size: 14px;
  font-weight: 500;
}

h4.card-title {
  font-size: 18px;
}

td {
  font-size: 12px;
  font-weight: 500;
}

h4.card-title {
  font-size: 16px !important;
}

button.btn.space-increment.btn-success {
  margin-right: 12px;
}
</style>
