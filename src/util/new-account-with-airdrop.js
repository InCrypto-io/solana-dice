// @flow

import {Account} from '@solana/web3.js';

/**
 * Create a new system account and airdrop it some lamports
 *
 * @private
 */
export async function newAccountWithAirdrop(connection, lamports) {
  if (!lamports) {
    lamports = 1;
  }
  const account = new Account();
  await connection.requestAirdrop(account.publicKey, lamports).catch(() => {
    console.error('Cant make airdrop for new account ', lamports);
  });
  return account;
}
