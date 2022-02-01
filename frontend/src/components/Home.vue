<template>
  <div>
    <br>
    <b-container fluid>
      <b-row>
        <b-col>
          <b-card
              title="General Info"
              class="custom-header-b-card"
          >
            <b-card-text class="custom-data-bot">
              Tradestatus: {{ tradeEnabled }} |
              Balance: {{ balance }}$ |
              Entry Counter: {{ counterEN }} |
              Takeprofit Counter: {{ counterTP }} |
              Stoploss Counter: {{ counterSL }} |
              TradeSize: {{ sizeTrade }} |
              Uptime: {{ uptime }}
            </b-card-text>

            <b-button v-if="entryArray.length > 0" @click="closeAllPosition()" variant="danger">Close All Position</b-button>
            <br>
            <br>

            <b-button v-if="tradeEnabled === false" @click="enableTrade()" class="space-increment" variant="success">Enable Trade</b-button>
            <b-button v-else @click="disableTrade()" ariant="dark">Disable Trade</b-button>

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

const BASE_URL = 'http://49.12.78.119:3000';

export default {
  data() {
    return {
      timer: '',
      balance: 0,
      uptime: 0,
      sizeTrade: 0,
      tradeEnabled: false,
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
      //this.tradeEnabled = infoData.tradeEnabled;

      const entryArrayReq = await fetch(BASE_URL + '/trade/entry');
      const entryArrayData = await entryArrayReq.json();

      for (let k in entryArrayData)
        if (entryArrayData[k] !== null) this.entryArray.push(entryArrayData[k]);

      this.entryArray = this.entryArray.sort(function (a, b) {
        return a.entrypricedate < b.entrypricedate ? 1 : a.entrypricedate > b.entrypricedate ? -1 : 0
      });


      const takeProfitArrayReq = await fetch(BASE_URL + '/trade/takeprofit');
      const takeProfitArrayData = await takeProfitArrayReq.json();

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

      // const exclusionListArratReq = await fetch(BASE_URL + '/getExclusionList');
      // const exclusionListArrayDat = await exclusionListArratReq.json();
      // console.log(exclusionListArrayDat)
      // for (let k in exclusionListArrayDat)
      //   if (exclusionListArrayDat[k] !== null) this.stopLossArray.push(exclusionListArrayDat[k]);

    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    },

    async closeAllPosition() {
      const res = await fetch(BASE_URL + '/trade/emergency');
      const result = await res.json();
      console.log(result);
    },

    async enableTrade() {
      //const res = await fetch(BASE_URL + '/trade/enableTrade');
      //const result = await res.json();
      //console.log(result);
      this.tradeEnabled = true;
    },

    async disableTrade() {
      //const res = await fetch(BASE_URL + '/trade/disableTrade');
      //const result = await res.json();
      //console.log(result);
      this.tradeEnabled = false;
    },

  },
  mounted() {
    this.getData();
    // refresh-data each 1 minute
    this.timer = setInterval(this.getData, 100000);
  },

  beforeDestroy() {
    this.cancelAutoUpdate();
  }

}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
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
