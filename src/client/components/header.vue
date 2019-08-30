<template>
    <header class="header">
        <div
                v-if="address.length > 0"
                class="account-panel"
        >
      <span class="account-address"
      >
        {{address}}
      </span>
            <div class="currentsolana-container">
                <img
                        class="solana-lg"
                        :src="solanaLogo"/>
                <span class="account-balance">{{balance}}</span>
            </div>
            <button
                    @click="requestAirdrop"
                    class="btn-action">REQUEST AN AIRDROP
            </button>
        </div>
        <button
                v-else
                @click="showLoginForm"
                class="btn-action">LOGIN
        </button>
        <nav>
            <ul>
                <li>
                    <a
                            v-if="address.length > 0"
                            @click="logout"
                            href="JavaScript:;">LOGOUT
                    </a>
                </li>
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
  import helper from "@/client/program/helper";
  import solanaLogo from '@/client/assets/solana-logo.svg';

  export default {
    methods: {
      showAbout() {
        eventHub.$emit('SHOW_ABOUT');
      },

      showLoginForm() {
        eventHub.$emit('SHOW_LOGIN_FORM');
      },

      logout() {
        this.$store.commit('UPDATE_ADDRESS', "");
        localStorage.setItem("USER_ADDRESS", "");
      },

      requestAirdrop() {
        helper.requestAirdrop().catch(console.error);
      },
    },

    data() {
      return {
        solanaLogo: solanaLogo,
      };
    },

    computed: {
      balance() {
        return this.$store.state.balance;
      },

      address() {
        return this.$store.state.address;
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
    .account-address {
        color: #fff;
        text-decoration: none;
        letter-spacing: .5px;
        font-weight: 600;
        font-size: .9em;
    }

    .account-balance {
        color: #fff;
        text-decoration: none;
        letter-spacing: .5px;
        font-weight: 600;
        font-size: .9em;
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
        padding: .5rem 1rem;
        color: #000;
        flex: 1;
        white-space: nowrap;
        flex-grow: 0;
    }

    .account-panel {
        display: flex;
        flex-direction: row;
        justify-content: start;
        align-items: center;
        width: 800px;
    }

    .account-panel * {
        margin: 10px;
    }

    .solana-lg {
        width: 22px;
        margin-right: 5px;
        vertical-align: middle;
    }

    .currentsolana-container {
        position: relative;
        display: flex;
        flex-direction: row;
    }
</style>

