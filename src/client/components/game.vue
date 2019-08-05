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
                            <li @click="setSOLANA(.5)">1/2</li>
                            <li @click="setSOLANA(1)">1X</li>
                            <li @click="setSOLANA(2)">2X</li>
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
                <div class="currentsolana-container">
                    <img
                            class="solana-lg"
                            :src="solanaLogo"/>
                    <span
                            :class="{
              'animateUp': this.showUpAnimation,
              'animateDown': this.showDownAnimation
            }"
                            class="solana-animation">{{animationTxt}}</span>
                    <span>{{balance}}</span>
                </div>
                <e-button
                        v-if="canMakeBet"
                        @click="makeBet"
                        class="btn-action">{{actionTxt}}
                </e-button>
                <span v-else class="warning-info">You need to fund your wallet</span>
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
                width="30%"
                :visible.sync="showAbout">
            <p slot="title">How To Play</p>
            <ol>
                <li>1. Set your BET AMOUNT. This is the amount of SOLANA you will be wagering.</li>
                <li>2. Adjust the slider to change your chance of winning.</li>
                <li>3. Click ROLL DICE to place your bet.</li>
                <li>4. If your number is lower than your ROLL UNDER TO WIN number, you win!</li>
            </ol>
            <p>You can view your balance next to the ROLL DICE button. The table below the slider bar shows recent bets
                from all players across the world.</p>
        </el-dialog>

    </section>
</template>

<script>
  import solanaLogo from '@/client/assets/solana-logo.svg';
  import tokenLogo from '@/client/assets/bet-token.png';
  import eventHub from '@/client/util/event';
  import helper from '@/client/program/helper';

  export default {
    mounted() {
      eventHub.$on('ROLLUNDER_CHANGE', rollUnder => this.rollUnder = rollUnder);
      eventHub.$on('SHOW_ABOUT', () => this.showAbout = true);
    },

    data() {
      return {
        solanaLogo: solanaLogo,
        tokenLogo,
        defaultBet: 10,
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
        showDownAnimation: false
      };
    },
    methods: {
      async makeBet() {
        await helper.makeBet(this.solana, this.rollUnder);
      },

      checkBetAmount() {
      },

      setSOLANA(rate) {
        const maxBet = this.balance > 50 ? this.balance - 50 : 0;
        let solana = rate ? this.defaultBet * rate : maxBet;
        if (solana > maxBet) {
          solana = maxBet;
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
        return (this.solana * this.payOut).toFixed(0);
      },

      account() {
        if (!this.$store.state.account) {
          return false;
        }
        return this.$store.state.account.publicKey.toBase58().length !== 0;
      },

      balance() {
        return this.$store.state.balance;
      },

      canMakeBet() {
        return this.account && this.solana < this.balance;
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
        font-size: 18px;
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
        font-size: 18px;
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
    }

    .game-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-top: 20px;
    }

    .game-footer > div {
        flex: 1;
        text-align: center;
        color: #fff;
        font-weight: 600;
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
        line-height: 1.5;
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
        color: #0191ee;
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
        color: #02f292;
        text-shadow: 0 0 5px #02f292;
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
</style>

