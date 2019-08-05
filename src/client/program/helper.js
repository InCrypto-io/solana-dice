import {Account, Connection, PublicKey} from '@solana/web3.js';
import axios from 'axios';
import {sha256} from 'js-sha256';
import {sleep} from '../util/sleep';
import {DiceGame} from '../../program/dice';
import {url, backendURL} from '../../../url';

class Helper {
  store = null;
  account = null;
  connection = null;
  config = {};

  init = async store => {
    this.store = store;

    this.connection = new Connection(url);
    this.account = new Account();
    this.store.commit('UPDATE_ACCOUNT', this.account);

    const dataResult = await axios.request({
      timeout: 5000,
      method: 'get',
      baseURL: backendURL,
      url: '/config',
    }).catch(this.handleConnectionError);
    if (dataResult.status !== 200) {
      console.error(dataResult);
      throw Error("can't resolve config");
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

    this.connection.onAccountChange(
      this.account.publicKey,
      this.accountChanged,
    );
    this.connection.onProgramAccountChange(
      this.config.dashboardProgramID,
      this.programChanged,
    );

    await this.fetchGamesList();
  };

  accountChanged = async () => {
    await this.updateBalance().catch(this.handleConnectionError);
  };

  programChanged = async () => {
    await sleep(2000);
    await this.fetchGamesList();
  };

  fetchGamesList = async () => {
    const dataResult = await axios.request({
      timeout: 5000,
      method: 'get',
      baseURL: backendURL,
      url: '/games',
    }).catch(this.handleConnectionError);
    if (dataResult.status === 200) {
      this.store.commit('UPDATE_GAMES_LIST', dataResult.data);
    }
  };

  updateBalance = async () => {
    const balance = await this.connection.getBalance(this.account.publicKey)
      .catch(this.handleConnectionError);
    this.store.commit('UPDATE_BALANCE', balance);
  };

  requestAirdrop = async () => {
    const lamports = 1000;
    await this.connection
      .requestAirdrop(this.account.publicKey, lamports)
      .catch(this.handleConnectionError);
    await this.updateBalance();
  };

  makeBet = async (betLamports, rollUnder) => {
    betLamports = Number(betLamports);
    rollUnder = Number(rollUnder);
    const diceGame = await DiceGame.makeBet(
      this.connection,
      this.config.dashboardProgramID,
      this.config.dashboardPublicKey,
      this.account,
      betLamports,
      rollUnder,
    ).catch(this.handleConnectionError);

    await this.updateBalance();

    if (diceGame) {
      diceGame.onChange(async () => {
        await sleep(3000);
        await diceGame.updateGameState();
        if (diceGame.state.state === 'Hash') {
          await diceGame.setSeed(this.getRandomSeed()).catch(this.handleConnectionError);
          await this.updateBalance();
        }
      });
    } else {
      console.error("have unprocessed game", diceGame);
    }
  };

  getRandomSeed = () => {
    return sha256(String(Math.random())).substr(0, 32);
  };

  handleConnectionError = (error) => {
    console.error(error);
    this.store.commit('UPDATE_CONNECTION_STATE', false);
  }
}

const helper = new Helper();

export default helper;
