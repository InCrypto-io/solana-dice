import {Connection, PublicKey} from '@solana/web3.js';
import axios from 'axios';
import {sha256} from 'js-sha256';

import {sleep} from '../util/sleep';
import {DiceGame} from '../../program/dice';
import {url, backendURL} from '../../../url';
import wallet from '../../util/wallet';

class Helper {
  store = null;
  connection = null;
  publicKey = null;
  config = {};
  currentSlot = 0;

  init = async store => {
    this.store = store;

    this.connection = new Connection(url);

    const dataResult = await axios.request({
      timeout: 5000,
      method: 'get',
      baseURL: backendURL,
      url: '/config',
    }).catch(this.handleConnectionError);
    if (!dataResult || dataResult.status !== 200) {
      console.error(dataResult);
      throw Error('Can\'t connect to server, try again later');
    }

    this.config.casinoPublicKey = new PublicKey(
      dataResult.data.casinoPublicKey,
    );
    this.config.dashboardProgramID = new PublicKey(
      dataResult.data.dashboardProgramID,
    );
    this.config.dashboardPublicKey = new PublicKey(
      dataResult.data.dashboardPublicKey,
    );

    await this.fetchGamesList();

    await this.updateCurrentSlot();
  };

  accountChanged = async () => {
    await this.updateBalance().catch(this.handleConnectionError);
  };

  programChanged = async () => {
    await sleep(2000);
    await this.fetchGamesList();
    await this.updateBalance().catch(this.handleConnectionError);
  };

  fetchGamesList = async () => {
    const dataResult = await axios.request({
      timeout: 5000,
      method: 'get',
      baseURL: backendURL,
      url: '/games',
    }).catch(this.handleConnectionError);
    if (dataResult && dataResult.status === 200) {
      this.store.commit('UPDATE_GAMES_LIST', dataResult.data);
    }
  };

  updateBalance = async () => {
    const balance = await this.connection.getBalance(this.publicKey)
      .catch(this.handleConnectionError);
    this.store.commit('UPDATE_BALANCE', balance);
  };

  requestAirdrop = async () => {
    const lamports = 1000;
    await this.connection
      .requestAirdrop(this.publicKey, lamports)
      .catch(this.handleConnectionError);
    await this.updateBalance();
  };

  makeBet = async (betLamports, rollUnder) => {
    betLamports = Number(betLamports);
    rollUnder = Number(rollUnder);
    const {transaction} = await DiceGame.makeBet(
      this.config.dashboardProgramID,
      this.config.dashboardPublicKey,
      this.publicKey,
      betLamports,
      rollUnder,
    );

    if (transaction) {
      await wallet.confirm(transaction, `Make bet (${betLamports} lamports, roll under ${rollUnder})`);
    }
    await this.updateBalance();
  };

  setSeed = async (address) => {
    const diceGame = new DiceGame(
      this.connection,
      this.config.dashboardProgramID,
      this.config.dashboardPublicKey,
      new PublicKey(address),
      this.publicKey,
      null,
      false,
    );

    await diceGame.updateGameState();
    if (diceGame.state.state === 'Hash') {
      const transaction = diceGame.setSeed(this.getRandomSeed());

      if (transaction) {
        await wallet.confirm(transaction, `Set seed`);
      }
    }
    await this.updateBalance();
  };

  makeWithdraw = async (address) => {
    const diceGame = new DiceGame(
      this.connection,
      this.config.dashboardProgramID,
      this.config.dashboardPublicKey,
      new PublicKey(address),
      this.publicKey,
      null,
      false,
    );

    await diceGame.updateGameState();
    if (diceGame.state.state !== 'Reveal' && diceGame.state.state !== 'Withdraw') {
      const transaction = diceGame.makeWithdraw();

      if (transaction) {
        await wallet.confirm(transaction, `Withdraw`);
      }
    }
    await this.updateBalance();
  };

  getRandomSeed = () => {
    return sha256(String(Math.random())).substr(0, 32);
  };

  handleConnectionError = (error) => {
    console.error(error);
    this.store.commit('DISPATCH_ERROR', error);
  };

  updateCurrentSlot = async () => {
    this.currentSlot = await this.connection.getSlot().catch(this.handleConnectionError);
    setTimeout(this.updateCurrentSlot, 3000);
  };

  updatePublicKey = (address) => {
    this.publicKey = new PublicKey(address);

    if (!this.publicKey || this.publicKey.toBase58() !== address) {
      return false;
    }

    this.connection.onAccountChange(
      this.publicKey,
      this.accountChanged,
    );
    this.connection.onProgramAccountChange(
      this.config.dashboardProgramID,
      this.programChanged,
    );

    this.updateBalance().catch();

    return true;
  };
}

const helper = new Helper();

export default helper;
