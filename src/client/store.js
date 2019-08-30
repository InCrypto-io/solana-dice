import Vue from 'vue';
import Vuex from 'vuex';
import {filter} from 'lodash';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    address: '',
    balance: 0,
    gamesList: [],
    messages: [],
  },

  mutations: {
    UPDATE_BALANCE(state, balance) {
      state.balance = balance;
    },
    UPDATE_GAMES_LIST(state, gamesList) {
      state.gamesList = gamesList;
    },
    DISPATCH_ERROR(state, error) {
      state.messages.push({
        id: Number(Date.now()) * Math.random(),
        type: 'error',
        message: error.message,
      });
      if (state.messages.length > 5) {
        state.messages.splice(0, 1);
      }
    },
    DISPATCH_MESSAGE(state, message) {
      state.messages.push({
        id: Number(Date.now()) * Math.random(),
        type: 'info',
        message: message,
      });
      if (state.messages.length > 5) {
        state.messages.splice(0, 1);
      }
    },
    REMOVE_MESSAGE(state, id) {
      state.messages = filter(state.messages, e => (e.id !== id));
    },
    UPDATE_ADDRESS(state, address) {
      state.address = address;
    },
  },
});
