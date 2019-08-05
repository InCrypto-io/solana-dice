// @flow

import {BpfLoader, NativeLoader, Account} from '@solana/web3.js';
import fs from 'mz/fs';
import path from 'path';

import {url} from '../../url';
import {Store} from './store';
import {Dashboard} from '../program/dashboard';
import {newAccountWithAirdrop} from '../util/new-account-with-airdrop';

/**
 * Obtain the Dashboard singleton object
 */
export async function findDashboard(connection): Promise<Object> {
  const store = new Store();
  let native = !!process.env.NATIVE;

  try {
    const config = await store.load('../../../server-store/config.json');
    if (config.native === native) {
      const dashboardAccount = new Account(
        Buffer.from(config.secretKey, 'hex'),
      );
      const dashboard = await Dashboard.connect(
        connection,
        dashboardAccount.publicKey,
      );
      return {
        dashboard,
        connection,
        casinoAccount: new Account(Buffer.from(config.casinoSecretKey, 'hex')),
      };
    }
  } catch (err) {
    console.log('findDashboard:', err.message);
  }

  const loaderAccount = await newAccountWithAirdrop(connection, 10000);

  let programId;
  if (native) {
    console.log('Using native program');
    programId = await NativeLoader.load(connection, loaderAccount, 'dice');
  } else {
    console.log('Using BPF program');
    const elf = await fs.readFile(
      path.join(__dirname, '..', '..', 'server-store', 'program', 'dice.so'),
    );

    let attempts = 5;
    while (attempts > 0) {
      try {
        console.log('Loading BPF program...');
        programId = await BpfLoader.load(connection, loaderAccount, elf);
        break;
      } catch (err) {
        attempts--;
        console.log(
          `Error loading BPF program, ${attempts} attempts remaining:`,
          err.message,
        );
      }
    }
  }
  if (!programId) {
    throw new Error('Unable to load program');
  }

  console.log('Dashboard programId:', programId.toBase58());

  const casinoAccount = await newAccountWithAirdrop(connection, 5000);

  const {dashboard, dashboardAccount} = await Dashboard.create(
    connection,
    programId,
    casinoAccount.publicKey,
  );
  await store.save('../../../server-store/config.json', {
    url,
    native,
    secretKey: Buffer.from(dashboardAccount.secretKey).toString('hex'),
    casinoSecretKey: Buffer.from(casinoAccount.secretKey).toString('hex'),
  });
  return {dashboard, connection, casinoAccount};
}

if (require.main === module) {
  findDashboard()
    .then(ret => {
      console.log('Dashboard:', ret.dashboard.publicKey.toBase58());
    })
    .then(process.exit)
    .catch(console.error)
    .then(() => 1)
    .then(process.exit);
}
