/**
 * Implements the command-line based game interface
 *
 * @flow
 */
import readline from 'readline-promise';

import {sleep} from '../util/sleep';
import {DiceGame} from '../program/dice';
import type {Board} from '../program/program-state';
import {findDashboard} from '../server/config';
import {newAccountWithAirdrop} from '../util/new-account-with-airdrop';
import {Connection} from '@solana/web3.js';
import {url} from '../../url';

async function test() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
  });

  rl.write(`Connecting to network...\n`);

  const connection = new Connection(url);
  console.log('Using', url);

  const {dashboard, casinoAccount} = await findDashboard(connection);
  rl.write(`Dashboard: ${dashboard.publicKey.toBase58()}\n`);
  rl.write(`Dashboard: ${JSON.stringify(dashboard.state, null, 4)}\n`);

  const programId = dashboard.programId;
  rl.write(`programId: ${programId.toBase58()}\n`);

  console.log(`Casino: ${casinoAccount.publicKey.toBase58()}\n`);
  // console.log(`Casino: `, casinoAccount.publicKey);

  const playerAccount = await newAccountWithAirdrop(connection, 2000);
  rl.write(`Player: ${playerAccount.publicKey.toBase58()}\n`);

  rl.write(`Make bet\n`);
  const diceGame = await DiceGame.makeBet(
    connection,
    dashboard.programId,
    dashboard.publicKey,
    playerAccount,
    10,
    44,
  ).catch(console.error);

  const casinoDiceGame = new DiceGame(
    connection,
    programId,
    dashboard.publicKey,
    diceGame.gamePublicKey, // todo get it from event
    null,
    casinoAccount,
  );

  await casinoDiceGame
    .setSeedHash(
      '0bf6f8b4c7e7ace728d89c68764854d5ff65b58e31d0c2618e5dc35e70a39a75',
    )
    .catch(console.error);

  await diceGame
    .setSeed('29999999999999999999999999781234')
    .catch(console.error);

  rl.write(`Bet created\n`);

  await diceGame.updateGameState();
  console.log('diceGame.state', diceGame.state);
  // await sleep(0.3 * 60 * 1000);
  // await diceGame.makeWithdraw().catch(()=>{console.log('locked');});
  // await diceGame.updateGameState();
  // console.log('diceGame.state', diceGame.state);
  await dashboard.updateDashboardState();
  // rl.write(`Dashboard: ${JSON.stringify(dashboard.state, null, 4)}\n`);

  await casinoDiceGame.updateGameState();

  rl.write(`Make reveal\n`);
  await casinoDiceGame
    .makeReveal(
      connection,
      dashboard.publicKey,
      casinoDiceGame.state.player,
      '35353535353535353535353535353535',
    )
    .catch(console.error);
  rl.write(`Make processed\n`);
}

test()
  .catch(err => {
    console.error(err);
  })
  .then(() => process.exit());
