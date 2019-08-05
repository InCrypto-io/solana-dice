import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    account: null,
    balance: 0,
    gamesList: [],
    stable: false,
  },

  mutations: {
    UPDATE_ACCOUNT(state, account) {
      state.account = account;
    },
    UPDATE_BALANCE(state, balance) {
      state.balance = balance;
    },
    UPDATE_GAMES_LIST(state, gamesList) {
      state.gamesList = gamesList;
    },
    UPDATE_CONNECTION_STATE(state, stable) {
      state.stable = stable;
    },
  },
});
