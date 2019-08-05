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
                <!--<th>state</th>-->
                <th>Bettor</th>
                <th>Roll Under</th>
                <th>Bet</th>
                <th>Roll</th>
                <th>Payout</th>
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
                <td>{{order.roll < 255 ? order.roll : ""}}</td>
                <td class="payout">
                    {{(order.rewardLamports !== 0 && order.roll < 255) ? order.rewardLamports : ''}}
                </td>
            </tr>
            </tbody>
        </table>
    </section>
</template>

<script>
  import {sortBy, reverse} from "lodash";

  export default {
    computed: {
      listGamesSorted() {
        return reverse(sortBy(this.$store.state.gamesList, ["numberGame"]));
      }
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
        color: #02f292;
        text-shadow: 0 0 5px #02f292;
    }
</style>

