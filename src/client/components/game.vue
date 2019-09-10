<template>
    <section class="game">
        <div class="form">
            <div class="form-group">
                <div>
                    <label>BET AMOUNT</label>
                    <div class="input-amount-group">
                        <div class="input-group">
                            <img
                                    class="solana-logo"
                                    :src="solanaLogo"/>
                            <input
                                    @change="checkBetAmount"
                                    v-model="solana"/>
                        </div>
                        <ul class="amount-rate">
                            <li @click="setSOLANA(.2)">1/5</li>
                            <li @click="setSOLANA(.5)">1/2</li>
                            <li @click="setSOLANA(2)">2X</li>
                            <li @click="setSOLANA(3)">3X</li>
                            <li @click="setSOLANA(4)">4X</li>
                            <li @click="setSOLANA()">MAX</li>
                        </ul>
                    </div>
                </div>
                <div>
                    <label>PAYOUT ON WIN</label>
                    <div class="bet-cell">
                        <img
                                class="solana-logo"
                                :src="solanaLogo"/>
                        <span>{{payWin}}</span>
                    </div>
                </div>
            </div>
            <div class="info-container">
                <ul>
                    <li>
                        <label>ROLL UNDER TO WIN</label>
                        <span>{{rollUnder}}</span>
                    </li>
                    <li>
                        <label>PAYOUT</label>
                        <span>{{Number(payOut).toFixed(2)}}x</span>
                    </li>
                    <li>
                        <label>WIN CHANCE</label>
                        <span>{{winChance}}%</span>
                    </li>
                </ul>
            </div>
            <footer class="game-footer">
                <el-button
                        v-if="canMakeBet"
                        @click="makeBet"
                        class="btn-action">{{actionTxt}}
                </el-button>
                <button
                        v-else-if="!address"
                        @click="goToLoginForm"
                        class="btn-action">LOGIN
                </button>
                <div v-else>
                    <span class="warning-info">You need to fund your wallet</span>
                    <button
                            @click="requestAirdrop"
                            class="btn-action">REQUEST AN AIRDROP
                    </button>
                </div>
                <div class="bet-balance">
                    <img
                            class="token-logo"
                            :src="tokenLogo"/>
                    <span>0.0000</span>
                </div>
            </footer>
        </div>

        <dice-slider
                :initial="rollUnder"
                :max="96"
                :min="2"/>

        <el-dialog
                width="40%"
                :visible.sync="showAbout">
            <b slot="title">How To Play</b>
            <pre class="instruction-pre">
    1. Login with your wallet address. Get coins using the airdrop for playing on the Solana testnet.
    2. Start game
        - Set your BET AMOUNT. This is the amount of SOL you will be wagering.
        - Adjust the slider to change your chance of winning.
        - Click ROLL DICE to place your bet.
    3. Finish game
        - Set seed - you have to set a seed for honesty control og game.
        - Withdraw - if the casino does not publish its seed for a long time or you do not want to continue the game, you can withdraw funds.
        - If the result derived from both seed is lower than your ROLL UNDER TO WIN number, you win!
            </pre>
            <b class="instruction-pre">The table below the slider bar shows recent bets from all players across the world.</b>
        </el-dialog>

        <el-dialog
                width="40%"
                :visible.sync="showLoginForm">
            <div class="login-form">
                <p>
                    You have to copy your address from
                    <a class="wallet-link" @click="openWallet" href="#">Solana wallet</a>
                </p>
                <p><b>Enter your address</b></p>
                <input class="login-address-input" v-model="loginAddress" v-on:input="changeLoginAddress()"/>
                <p/>
                <p v-if="wrongLoginAddress">Wrong address, try get it from wallet</p>
                <p/>
                <el-button
                        @click="login"
                        class="btn-action">LOGIN
                </el-button>
                <p/>
            </div>
        </el-dialog>
    </section>
</template>

<script>
  import solanaLogo from '@/client/assets/solana-logo.svg';
  import tokenLogo from '@/client/assets/bet-token.png';
  import eventHub from '@/client/util/event';
  import helper from '@/client/program/helper';
  import wallet from '../../util/wallet';

  export default {
    mounted() {
      eventHub.$on('ROLLUNDER_CHANGE', rollUnder => this.rollUnder = rollUnder);
      eventHub.$on('SHOW_ABOUT', () => this.showAbout = true);
      eventHub.$on('SHOW_LOGIN_FORM', () => this.showLoginForm = true);
    },

    data() {
      return {
        solanaLogo: solanaLogo,
        tokenLogo,
        solana: 10,
        rollUnder: 50,
        currentSOLANA: 0,
        poolBalance: 0,
        timer: 0,
        animationTxt: 0,
        actionTxt: 'ROLL DICE',
        showAbout: false,
        showSocial: false,
        animating: false,
        showUpAnimation: false,
        showDownAnimation: false,
        showLoginForm: false,
        loginAddress: "",
        wrongLoginAddress: false,
      };
    },
    methods: {
      async makeBet() {
        await helper.makeBet(this.solana, this.rollUnder);
      },

      checkBetAmount() {
      },

      changeLoginAddress() {
        this.wrongLoginAddress = false;
      },

      requestAirdrop() {
        helper.requestAirdrop().catch(console.error);
      },

      login() {
        if (helper.updatePublicKey(this.loginAddress)) {
          localStorage.setItem("USER_ADDRESS", this.loginAddress);
          this.$store.commit('UPDATE_ADDRESS', this.loginAddress);
          this.loginAddress = "";
          this.showLoginForm = false;
          this.wrongLoginAddress = false;
        } else {
          this.wrongLoginAddress = true;
        }
      },

      goToLoginForm() {
        eventHub.$emit('SHOW_LOGIN_FORM');
      },

      openWallet() {
        wallet.send(" ", "");
      },

      setSOLANA(rate) {
        const maxBet = this.balance > 100 ? this.balance - 100 : 0;
        let bet = this.solana;
        if (bet === 0) {
          bet = 10;
        }
        let solana = rate ? bet * rate : maxBet;
        if (solana > maxBet) {
          solana = maxBet;
        } else if (solana < 10) {
          solana = 10;
        }
        this.solana = Number(solana).toFixed(0);
      },
    },

    watch: {
      animating() {
        const {animating} = this;
        if (!animating) {
          clearInterval(this.timer);
          this.actionTxt = 'ROLL DICE';
          return;
        }
        this.timer = setInterval(() => {
          this.actionTxt = (Math.random() * 100).toFixed(0);
        }, 100);
      }
    },
    components: {
      diceSlider: require('@/client/components/slider').default
    },
    computed: {
      winChance() {
        return this.rollUnder - 1;
      },

      payOut() {
        return 98 / this.winChance;
      },

      payWin() {
        return Math.floor(this.solana * this.payOut).toFixed(0);
      },

      address() {
        if (!this.$store.state.address) {
          return false;
        }
        return this.$store.state.address.length !== 0;
      },

      balance() {
        return this.$store.state.balance;
      },

      canMakeBet() {
        return this.address && ((Number(this.solana) + 100) <= this.balance);
      }
    }
  };
</script>

<style scoped>
    .game {
        background: url('../assets/bg.svg') center center no-repeat;
        background-color: black;
        background-size: cover;
        padding: 60px 0;
    }

    .form {
        width: 655px;
        border-radius: 5px;
        font-size: 12px;
        background-color: #4b4848;
        margin: 0 auto 20px auto;
        padding: 20px 30px;
    }

    .form-group {
        display: flex;
        align-items: center;
    }

    .form-group > div:last-child {
        flex: 1;
    }

    .amount-rate {
        display: flex;
        align-items: center;
    }

    .amount-rate li {
        color: #9b9fae;
        font-size: .6em;
        font-weight: 600;
    }

    .amount-rate li:not(:last-child) {
        border-right: 2px solid #2F2F2F;
    }

    .form-group {
        margin-bottom: 20px;
    }

    .form-group label {
        color: #9b9fae;
        font-weight: 600;
        font-size: .6em;
        margin-bottom: .75em;
        display: block;
    }

    .form-group input {
        text-align: center;
        border: none;
        padding: 10px 12px;
        borde-radius: .3em;
        font-weight: 600;
        letter-spacing: .2px;
        font-size: 12px;
        outline: none;
        background-color: #4b4848;
        width: 177px;
        color: #fff;
    }

    .input-amount-group {
        display: flex;
        align-items: center;
        background-color: #3f3e3e;
        padding: 2px;
        border-radius: .3em;
        margin-right: 30px;
        height: 47px;
        position: relative;
    }

    .input-amount-group ul li {
        cursor: pointer;
        padding: 8px 15px;
    }

    .input-amount-group ul li:hover {
        background-color: #0000003f;
    }

    .input-group {
        flex: 1;
    }

    .input-group input {
        padding-left: 15px;
    }

    .input-group .solana-logo {
        position: absolute;
        left: 10px;
        top: 12.5px;
    }

    .info-container {
        background-color: #3F3E3E;
        padding: 20px;
    }

    .info-container ul {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .info-container ul > li {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
    }

    .info-container ul > li:not(:last-child) {
        border-right: 2px solid #2F2F2F;
    }

    .info-container ul > li > label {
        color: #9b9fae;
        font-weight: 600;
        font-size: .6em;
        margin-bottom: .75em;
        display: block;
    }

    .info-container ul > li > span {
        color: #fff;
        font-size: 1.2em;
        font-weight: 600;
        letter-spacing: .5px;
    }

    .bet-cell {
        background-color: #3f3e3e;
        border-radius: .3em;
        height: 47px;
        line-height: 47px;
        text-align: center;
        position: relative;
    }

    .bet-cell > span {
        color: #fff;
        font-weight: 600;
    }

    .bet-cell .solana-logo {
        position: absolute;
        left: 10px;
        top: 12.5px;
    }

    .warning-info {
        color: #fff;
        font-weight: 600;
        height: 34px;
        top: -38px;
        vertical-align: center;
        padding: .5rem 1rem;
        line-height: 1.5;
    }

    .game-footer {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: 20px;
        margin-bottom: -20px;
    }

    .game-footer > div {
        flex: 1;
        text-align: center;
        color: #fff;
        font-weight: 600;
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
        text-align: center;
    }

    .solana-logo {
        height: 22px;
    }

    .solana-lg {
        width: 22px;
        margin-right: 5px;
        vertical-align: middle;
    }

    .token-logo {
        width: 22px;
        vertical-align: middle;
        margin-right: 5px;
    }

    .game >>> .el-dialog {
        background-color: #4A4848;
    }

    .game >>> .el-dialog__header {
        font-weight: 700;
        text-align: center;
        letter-spacing: .5px;
        color: #fff;
        font-size: 1.25em;
    }

    .game >>> .el-dialog__body {
        color: #fff;
        padding-top: 0;
        font-weight: 700;
        letter-spacing: .5px;
        color: #fff;
        font-size: 1em;
    }

    .game >>> .el-dialog__body li,
    .game >>> .el-dialog__body p {
        margin-bottom: 10px;
    }

    .game >>> .el-dialog__body a {
        color: #00ffad;
        text-decoration: none;
    }

    .game >>> .el-dialog__body a:hover {
        text-decoration: underline;
    }

    .social-links {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 30px 30px 0 30px;
        font-size: 1.2em;
    }

    .social-links li {
        border-radius: 50%;
        padding: 10px;
        cursor: pointer;
        transition: background-color ease 200ms;
    }

    .social-links li:hover {
        background-color: #6C2DED;
    }

    .bet-balance {
        visibility: hidden;
    }

    .currentsolana-container {
        position: relative;
    }

    .solana-animation {
        opacity: 0;

        position: absolute;
    }

    .solana-animation.animateUp {
        animation: fadeOutUp 3s;
        color: #00FFAD;
        text-shadow: 0 0 5px #00FFAD;
    }

    .solana-animation.animateDown {
        animation: fadeOutDown 1s;
        color: #CD4263;
        text-shadow: 0 0 5px #CD4263;
    }

    @keyframes fadeOutUp {
        from {
            opacity: 1;
        }

        to {
            opacity: 0;
            -webkit-transform: translate3d(0, -100%, 0);
            transform: translate3d(0, -100%, 0);
        }
    }

    @keyframes fadeOutDown {
        from {
            opacity: 1;
        }

        to {
            opacity: 0;
            -webkit-transform: translate3d(0, 100%, 0);
            transform: translate3d(0, 100%, 0);
        }
    }

    .login-form {
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .login-address-input {
        text-align: center;
        border-width: 1px;
        padding: 10px 12px;
        borde-radius: .3em;
        font-weight: 600;
        letter-spacing: .2px;
        font-size: 12px;
        outline: none;
        background-color: #4b4848;
        color: #fff;
    }

    .instruction-pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        word-break: break-word;
    }

</style>

