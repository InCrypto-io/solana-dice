<template>
    <section class="orders-container">
        <header class="orders-tab">
            <ul>
                <li>ALL BETS</li>
            </ul>
        </header>
        <table class="orders-table">
            <thead>
            <tr>
                <!--<th>State</th>-->
                <th>Bettor</th>
                <th>Roll Under</th>
                <th>Bet</th>
                <th>Roll</th>
                <th>Payout</th>
                <th>Actions</th>
            </tr>
            </thead>
            <tbody>
            <tr
                    :key="index"
                    v-for="(order, index) in listGamesSorted">
                <!--<td>{{order.state}}</td>-->
                <td>{{order.player}}</td>
                <td>{{order.rollUnder}}</td>
                <td>{{order.betLamports}}</td>
                <td>{{order.roll < 255 ? order.roll : ''}}</td>
                <td class="payout" v-if="order.rewardLamports !== 0">
                    {{(order.rewardLamports !== 0 && order.roll < 255) ? order.rewardLamports : ''}}
                </td>
                <td class="withdraw" v-else-if="order.state === 'Withdraw'">
                    {{order.betLamports}}
                </td>
                <td class="lose" v-else>
                    {{(order.rewardLamports === 0 && order.roll < 255) ? `-${order.betLamports}` : ''}}
                </td>
                <div>
                    <el-button
                            v-if="sedSeedIsVisible(order.state, order.player)"
                            @click="sedSeed(order.publicKey)"
                            class="btn-action">SET SEED
                    </el-button>
                    <el-button
                            v-if="withdrawIsVisible(order.state, order.player)"
                            @click="withdraw(order.publicKey)"
                            :disabled="withdrawIsDisabled(order.lockInSlot)"
                            class="btn-action">WITHDRAW
                    </el-button>
                </div>
            </tr>
            </tbody>
        </table>
    </section>
</template>

<script>
  import {sortBy, reverse} from "lodash";
  import helper from '@/client/program/helper';
  import eventHub from '@/client/util/event';

  export default {
    mounted() {
      eventHub.$on('UPDATE_ORDERS', () => {
        this.$forceUpdate()
      });
    },
    computed: {
      listGamesSorted() {
        return reverse(sortBy(this.$store.state.gamesList, ["numberGame"]));
      }
    },
    methods: {
      withdraw(address) {
        helper.makeWithdraw(address).catch(console.error);
      },
      sedSeed(address) {
        helper.setSeed(address).catch(console.error);
      },
      sedSeedIsVisible(state, address) {
        return state === "Hash" && address === this.$store.state.address;
      },
      withdrawIsVisible(state, address) {
        return state !== "Reveal" && state !== "Withdraw" && address === this.$store.state.address;
      },
      withdrawIsDisabled(lockInSlot) {
        return lockInSlot + 100 >= helper.currentSlot;
      },
    }
  };
</script>

<style scoped>
    .orders-container {
        background-color: #191919;
        padding: 20px;
    }

    .orders-tab {
        color: #fff;
        display: flex;
        justify-content: center;
        margin-bottom: 20px;
    }

    .orders-tab ul {
        display: flex;
        align-items: center;
        border-bottom: 2px solid #bbb;
    }

    .orders-tab ul li {
        cursor: pointer;
        padding: 7px 35px;
        display: inline-block;
        text-align: center;
        color: #bbb;
        letter-spacing: .5px;
        font-weight: 600;
    }

    .orders-table {
        width: 90%;
        color: #fff;
        font-weight: 900;
        letter-spacing: .5px;
        border-collapse: collapse;
        margin: 0 auto;
    }

    .orders-table tbody tr {
        border-radius: 5px;
    }

    .orders-table tbody tr:nth-child(even) {
        background-color: #292929;
    }

    .orders-table td {
        font-size: 16px;
        padding: 20px 0;
        text-align: center;
    }

    .payout {
        color: #00FFAD;
        text-shadow: 0 0 5px #00FFAD;
    }

    .lose {
        color: #DE3162;
        text-shadow: 0 0 5px #DE3162;
    }

    .withdraw {
        color: #f29200;
        text-shadow: 0 0 5px #f29200;
    }
    .btn-action {
        height: 38px;
        line-height: 1.5;
        border: none;
        outline: none;
        font-weight: 600;
        font-size: 12px;
        background-color: #00FFAD;
        cursor: pointer;
        color: #000;
        flex: 1;
        white-space: nowrap;
        text-align: center;
        margin: 10px 5px 5px;
    }

    .btn-action:disabled {
        background-color: #bbbbbb;
        border-color: #9999bb;
        color: #111;
    }
</style>

