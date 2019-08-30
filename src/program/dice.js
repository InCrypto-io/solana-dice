/**
 *
 * The DiceGame class exported by this file is used to interact with the
 * on-chain tic-tac-toe game program.
 *
 * @flow
 */

import EventEmitter from 'event-emitter';
import {Account, SystemProgram, Transaction} from '@solana/web3.js';

import * as ProgramCommand from './program-command';
import {deserializeGame} from './program-state';
import {sendAndConfirmTransaction} from '../util/send-and-confirm-transaction';

export class DiceGame {
  disconnected;
  connection;
  programId;
  dashboardPublicKey;
  gamePublicKey;
  playerPublicKey;
  casinoAccount;
  state;
  _ee;
  _changeSubscriptionId;

  constructor(
    connection,
    programId,
    dashboardPublicKey,
    gamePublicKey,
    playerPublicKey,
    casinoAccount,
    subscribe,
  ) {
    let changeSubscriptionId = undefined;
    if (subscribe) {
      changeSubscriptionId = connection.onAccountChange(
        gamePublicKey,
        this._onAccountChange.bind(this),
      );
    }
    Object.assign(this, {
      disconnected: false,
      connection,
      gamePublicKey,
      playerPublicKey,
      casinoAccount,
      programId,
      dashboardPublicKey,
      _changeSubscriptionId: changeSubscriptionId,
      _ee: new EventEmitter(),
    });
  }

  static makeBet(
    programId,
    dashboardPublicKey,
    playerPublicKey,
    betLamports,
    rollUnder,
  ) {
    const gameAccount = new Account();
    const GAME_DATA_SIZE = 0xa9;
    const transaction = SystemProgram.createAccount(
      playerPublicKey,
      gameAccount.publicKey,
      betLamports + 50,
      GAME_DATA_SIZE, // data space
      programId,
    );

    transaction.add({
      keys: [
        {pubkey: dashboardPublicKey, isSigner: false, isDebitable: true},
        {pubkey: gameAccount.publicKey, isSigner: false, isDebitable: true},
        {pubkey: playerPublicKey, isSigner: true, isDebitable: false},
        {
          pubkey: ProgramCommand.getSyscallCurrentPublicKey(),
          isSigner: false,
          isDebitable: false,
        },
      ],
      programId,
      data: ProgramCommand.makeBet(betLamports, rollUnder),
    });

    return {
      transaction,
      gameAccount,
    };
  }

  async setSeedHash(casinoSeedHash) {
    const transaction = new Transaction();
    transaction.add({
      keys: [
        {pubkey: this.dashboardPublicKey, isSigner: false, isDebitable: true},
        {pubkey: this.gamePublicKey, isSigner: false, isDebitable: true},
        {
          pubkey: this.casinoAccount.publicKey,
          isSigner: true,
          isDebitable: false,
        },
      ],
      programId: this.programId,
      data: ProgramCommand.setSeedHash(casinoSeedHash),
    });

    await sendAndConfirmTransaction(
      'SetHash',
      this.connection,
      transaction,
      this.casinoAccount,
    );
  }

  setSeed(seed) {
    const transaction = new Transaction();
    transaction.add({
      keys: [
        {pubkey: this.dashboardPublicKey, isSigner: false, isDebitable: true},
        {pubkey: this.gamePublicKey, isSigner: false, isDebitable: true},
        {
          pubkey: this.playerPublicKey,
          isSigner: true,
          isDebitable: true,
        },
      ],
      programId: this.programId,
      data: ProgramCommand.setSeed(seed),
    });

    return transaction;
  }

  async makeReveal(connection, dashboardPublicKey, playerPublicKey, seed) {
    const transaction = new Transaction();
    transaction.add({
      keys: [
        {pubkey: dashboardPublicKey, isSigner: false, isDebitable: false},
        {pubkey: this.gamePublicKey, isSigner: false, isDebitable: true},
        {
          pubkey: this.casinoAccount.publicKey,
          isSigner: true,
          isDebitable: false,
        },
        {pubkey: playerPublicKey, isSigner: true, isDebitable: true},
      ],
      programId: this.programId,
      data: ProgramCommand.makeReveal(seed),
    });

    await sendAndConfirmTransaction(
      'MakeReveal',
      connection,
      transaction,
      this.casinoAccount,
    );
  }

  makeWithdraw() {
    const transaction = new Transaction();
    transaction.add({
      keys: [
        {pubkey: this.dashboardPublicKey, isSigner: false, isDebitable: false},
        {pubkey: this.gamePublicKey, isSigner: false, isDebitable: true},
        {
          pubkey: this.playerPublicKey,
          isSigner: true,
          isDebitable: true,
        },
        {
          pubkey: ProgramCommand.getSyscallCurrentPublicKey(),
          isSigner: false,
          isDebitable: false,
        },
      ],
      programId: this.programId,
      data: ProgramCommand.makeWithdraw(),
    });

    return transaction;
  }

  async updateGameState() {
    if (!!this.connection && !!this.gamePublicKey) {
      const accountInfo = await this.connection.getAccountInfo(
        this.gamePublicKey,
      );
      this.state = deserializeGame(accountInfo, this.gamePublicKey);
    }
  }

  _onAccountChange() {
    this.updateGameState().catch(console.error);
    this._ee.emit('change');
  }

  onChange(fn) {
    this._ee.on('change', fn);
  }

  removeChangeListener(fn) {
    this._ee.off('change', fn);
  }
}
