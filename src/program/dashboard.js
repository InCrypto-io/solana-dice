/**
 *
 * The DiceGame Dashboard class exported by this file is used to interact with the
 * on-chain tic-tac-toe dashboard program.
 *
 * @flow
 */

import EventEmitter from 'event-emitter';
import {Account, SystemProgram} from '@solana/web3.js';

import {newAccountWithAirdrop} from '../util/new-account-with-airdrop';
import {sendAndConfirmTransaction} from '../util/send-and-confirm-transaction';
import * as ProgramCommand from './program-command';
import {deserializeDashboard} from './program-state';

export class Dashboard {
  state;
  connection;
  programId;
  publicKey;
  _ee;
  _changeSubscriptionId;

  /**
   * @private
   */
  constructor(connection, programId, publicKey) {
    Object.assign(this, {
      connection,
      programId,
      publicKey,
      _changeSubscriptionId: connection.onAccountChange(
        publicKey,
        this._onAccountChange.bind(this),
      ),
      _ee: new EventEmitter(),
    });
  }

  /**
   * Creates a new dashboard
   */
  static async create(connection, programId, casinoPublicKey) {
    const lamports = 2000;
    const fee = 100; // TODO: use FeeCalculator to properly account for the transaction fee
    const tempAccount = await newAccountWithAirdrop(connection, lamports + fee);

    const dashboardAccount = new Account();

    const DASHBOARD_DATA_SIZE = 0x48;
    const transaction = SystemProgram.createAccount(
      tempAccount.publicKey,
      dashboardAccount.publicKey,
      lamports,
      DASHBOARD_DATA_SIZE, // data space
      programId,
    );
    transaction.add({
      keys: [
        {pubkey: dashboardAccount.publicKey, isSigner: true, isDebitable: true},
      ],
      programId,
      data: ProgramCommand.initDashboard(casinoPublicKey),
    });
    await sendAndConfirmTransaction(
      'initDashboard',
      connection,
      transaction,
      tempAccount,
      dashboardAccount,
    );

    return {
      dashboard: new Dashboard(
        connection,
        programId,
        dashboardAccount.publicKey,
      ),
      dashboardAccount,
    };
  }

  /**
   * Connects to an existing dashboard
   */
  static async connect(connection, publicKey) {
    const accountInfo = await connection.getAccountInfo(publicKey);
    const {owner} = accountInfo;

    const dashboard = new Dashboard(connection, owner, publicKey);
    dashboard.state = deserializeDashboard(accountInfo);
    return dashboard;
  }

  async updateDashboardState() {
    if (!!this.connection && !!this.publicKey) {
      const accountInfo = await this.connection.getAccountInfo(this.publicKey);
      this.state = deserializeDashboard(accountInfo);
    }
  }

  /**
   * @private
   */
  _onAccountChange(accountInfo) {
    this.state = deserializeDashboard(accountInfo);
    this._ee.emit('change');
  }

  /**
   * Register a callback for notification when the dashboard state changes
   */
  onChange(fn) {
    this._ee.on('change', fn);
  }

  /**
   * Remove a previously registered onChange callback
   */
  removeChangeListener(fn) {
    this._ee.off('change', fn);
  }
}
