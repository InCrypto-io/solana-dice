<template>
    <main id="app">
        <dice-header/>
        <dice-message/>
        <dice-game/>
        <dice-orders/>
    </main>
</template>

<script>
  import helper from "@/client/program/helper";
  import eventHub from '@/client/util/event';

  export default {
    mounted() {
      helper.init(this.$store)
        .then(() => {
          helper.updateCurrentSlot().then(() => {
            eventHub.$emit('UPDATE_ORDERS');
          });
          if (localStorage.getItem("USER_ADDRESS")) {
            if (helper.updatePublicKey(localStorage.getItem("USER_ADDRESS"))) {
              this.$store.commit('UPDATE_ADDRESS', localStorage.getItem("USER_ADDRESS"));
              helper.updateBalance().catch();
            }
          }
        })
        .catch((e) => {
          console.error(e);
          this.$store.commit('DISPATCH_ERROR', e);
        });
    },

    components: {
      diceMessage: require('@/client/components/message').default,
      diceHeader: require('@/client/components/header').default,
      diceGame: require('@/client/components/game').default,
      diceOrders: require('@/client/components/orders').default
    },
  };
</script>

<style>
    #app {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        font-size: 16px;
    }
</style>
