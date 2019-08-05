<template>
  <header class="header">
    <div>
      <img
      class="dice-logo"
      :src="diceLogo" />
    </div>
    <div
            v-if="account"
            class="account-panel"
    >
      <span class="account-address"
      >
        {{account.publicKey.toBase58()}}
      </span>
    </div>
    <button
            @click="requestAirdrop"
            class="btn-action">request an airdrop</button>
    <nav>
      <ul>
        <li>
          <a
            @click="showAbout"
            href="JavaScript:;">HOW TO PLAY</a>
        </li>
      </ul>
    </nav>
  </header>
</template>

<script>
import eventHub from '@/client/util/event';
import diceLogo from '@/client/assets/dice.svg';
import helper from "@/client/program/helper";

export default {
  methods: {
    showAbout() {
      eventHub.$emit('SHOW_ABOUT');
    },

    requestAirdrop() {
      helper.requestAirdrop().catch(console.error);
    },
  },

  data() {
    return {
      diceLogo
    };
  },

  computed: {
    account() {
      return this.$store.state.account;
    }
  }
};
</script>

<style scoped>
  .header {
    background-color: #3F3E3E;
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    height: 76px;
    justify-content: space-between;
    padding: 0 30px;
  }

  .header ul {
    display: flex;
    align-items: center;
  }

  .header ul li {
    margin-left: 30px;
  }

  .header a {
    color: #fff;
    text-decoration: none;
    letter-spacing: .5px;
    font-weight: 600;
    font-size: .9em;
  }

  .header .account-cell {
    color: #fff;
  }

  .header .account-cell > span {
    margin-right: 10px;
  }

  .header a:hover {
    text-shadow: 0 0 5px #fff;
  }

  .icon-logout {
    cursor: pointer;
  }

  .dice-logo {
    width: 40px;
    vertical-align: middle;
    margin-right: 30px;
  }

  .account-address {
    color: #fff;
    text-decoration: none;
    letter-spacing: .5px;
    font-weight: 600;
    font-size: .9em;
  }

  .btn-action {
    outline: none;
    letter-spacing: 3px;
    font-weight: 600;
    font-size: 18px;
    background-color: #00ffbb;
    border-color: #00ffbb;
    cursor: pointer;
    padding: .5rem 1rem;
    line-height: 1.5;
    border-radius: .3rem;
    color: #fff;
    flex: 1;
    white-space: nowrap;
    max-width: 250px;
  }

  .account-panel{
    display: flex;
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }
</style>

