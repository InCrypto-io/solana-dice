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
  playerAccount;
  casinoAccount;
  state;
  _ee;
  _changeSubscriptionId;

  constructor(
    connection,
    programId,
    dashboardPublicKey,
    gamePublicKey,
    playerAccount,
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
      playerAccount,
      casinoAccount,
      programId,
      dashboardPublicKey,
      _changeSubscriptionId: changeSubscriptionId,
      _ee: new EventEmitter(),
    });
  }

  static async makeBet(
    connection,
    programId,
    dashboardPublicKey,
    playerAccount,
    betLamports,
    rollUnder,
  ) {
    const gameAccount = new Account();
    const GAME_DATA_SIZE = 0xa0;
    const transaction = SystemProgram.createAccount(
      playerAccount.publicKey,
      gameAccount.publicKey,
      betLamports + 50,
      GAME_DATA_SIZE, // data space
      programId,
    );

    transaction.add({
      keys: [
        {pubkey: dashboardPublicKey, isSigner: false, isDebitable: true},
        {pubkey: gameAccount.publicKey, isSigner: false, isDebitable: true},
        {pubkey: playerAccount.publicKey, isSigner: true, isDebitable: false},
        {
          pubkey: ProgramCommand.getSyscallCurrentPublicKey(),
          isSigner: false,
          isDebitable: false,
        },
      ],
      programId,
      data: ProgramCommand.makeBet(betLamports, rollUnder),
    });

    await sendAndConfirmTransaction(
      'MakeBet',
      connection,
      transaction,
      playerAccount,
    );

    return new DiceGame(
      connection,
      programId,
      dashboardPublicKey,
      gameAccount.publicKey,
      playerAccount,
      null,
      true
    );
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

  async setSeed(seed) {
    const transaction = new Transaction();
    transaction.add({
      keys: [
        {pubkey: this.dashboardPublicKey, isSigner: false, isDebitable: true},
        {pubkey: this.gamePublicKey, isSigner: false, isDebitable: true},
        {
          pubkey: this.playerAccount.publicKey,
          isSigner: true,
          isDebitable: true,
        },
      ],
      programId: this.programId,
      data: ProgramCommand.setSeed(seed),
    });

    await sendAndConfirmTransaction(
      'SetSeed',
      this.connection,
      transaction,
      this.playerAccount,
    );
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
        {pubkey: playerPublicKey, isSigner: true, isDebitable: false},
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

  async makeWithdraw() {
    const transaction = new Transaction();
    transaction.add({
      keys: [
        {pubkey: this.dashboardPublicKey, isSigner: false, isDebitable: false},
        {pubkey: this.gamePublicKey, isSigner: false, isDebitable: true},
        {
          pubkey: this.playerAccount.publicKey,
          isSigner: true,
          isDebitable: false,
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

    await sendAndConfirmTransaction(
      'MakeWithdraw',
      this.connection,
      transaction,
      this.playerAccount,
    );
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
