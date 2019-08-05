<template>
    <main
            v-if="stable"
            id="app">
        <dice-header/>
        <dice-game/>
        <dice-orders/>
    </main>
    <span v-else class="body-alert">Service is not available, try again later</span>
</template>

<script>
  import helper from "@/client/program/helper";

  export default {
    mounted() {
      helper.init(this.$store)
        .then(() => {
          this.$store.commit('UPDATE_CONNECTION_STATE', true);
        })
        .catch((e) => {
          console.error(e);
          this.$store.commit('UPDATE_CONNECTION_STATE', false);
      });
    },

    components: {
      diceHeader: require('@/client/components/header').default,
      diceGame: require('@/client/components/game').default,
      diceOrders: require('@/client/components/orders').default
    },

    computed: {
      stable() {
        return this.$store.state.stable;
      }
    }
  };
</script>

<style>
    #app {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-size: 16px;
    }
    .body-alert {
        color: #fff;
    }
</style>
