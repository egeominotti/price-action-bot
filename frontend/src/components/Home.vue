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
              Balance: {{ balance }}$ |
              TradeSize: {{ sizeTrade }} |
              Uptime: {{ uptime }}
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
              title="Entry Token"
              class="custom-header-b-card"
          >
            <b-card-text class="custom-font">
              <b-table striped hover :items="entryArray"></b-table>
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
              title="Takeprofit Token"
              class="custom-header-b-card"
          >
            <b-card-text>
              <b-table striped hover :items="takeProfitArray"></b-table>
            </b-card-text>

          </b-card>
        </b-col>

        <b-col>
          <b-card
              title="Stoploss Token"
              class="custom-header-b-card"
          >
            <b-card-text>
              <b-table striped hover :items="stopLossArray"></b-table>
            </b-card-text>

          </b-card>
        </b-col>

      </b-row>
    </b-container>


  </div>
</template>


<script>

const BASE_URL = 'http://localhost:3000';

export default {
  data() {
    return {
      timer: '',
      balance: 0,
      uptime: 0,
      sizeTrade: 0,
      token: null,
      tokenArray: null,
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

      const infoReq = await fetch(BASE_URL + '/info');
      const infoData = await infoReq.json();

      this.balance = infoData.balance;
      this.uptime = infoData.uptime;
      this.sizeTrade = infoData.sizeTrade;

      const entryArrayReq = await fetch(BASE_URL + '/trade/entry');
      const entryArrayData = await entryArrayReq.json();

      for (let k in entryArrayData)
        if (entryArrayData[k] !== null) this.entryArray.push(entryArrayData[k]);

      const takeProfitArrayReq = await fetch(BASE_URL + '/trade/takeprofit');
      const takeProfitArrayData = await takeProfitArrayReq.json();

      for (let k in takeProfitArrayData)
        if (takeProfitArrayData[k] !== null) this.takeProfitArray.push(takeProfitArrayData[k]);

      const stopLossArrayReq = await fetch(BASE_URL + '/trade/stoploss');
      const stopLossArrayData = await stopLossArrayReq.json();

      for (let k in stopLossArrayData)
        if (stopLossArrayData[k] !== null) this.stopLossArray.push(stopLossArrayData[k]);

    },

    cancelAutoUpdate() {
      clearInterval(this.timer);
    }

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
td {
  font-size: 14px !important;
}

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
</style>
