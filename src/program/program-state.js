/**
 * Functions to deserialize Dice Game and Dashboard account data
 *
 * @flow
 */

import * as BufferLayout from 'buffer-layout';
import {PublicKey} from '@solana/web3.js';
import {assign} from 'lodash';

const publicKeyLayout = property => {
  if (!property) {
    property = 'publicKey';
  }
  return BufferLayout.blob(32, property);
};

export function deserializeGame(accountInfo, publicKey) {
  const gameLayout = BufferLayout.struct([
    BufferLayout.nu64('state'),
    publicKeyLayout('player'),
    BufferLayout.blob(16, 'seed'),
    BufferLayout.blob(32, 'casinoSeedHash'),
    BufferLayout.nu64('lockInSlot'),
    BufferLayout.nu64('betLamports'),
    BufferLayout.u8('rollUnder'),
    publicKeyLayout('previousGamePublicKey'),
    BufferLayout.u32be('numberGame'),
    BufferLayout.u32be('roll'),
    BufferLayout.nu64be('rewardLamports'),
  ]);
  const game = gameLayout.decode(accountInfo.data);

  // console.log('accountInfo.data', accountInfo.data.toString('hex'));
  // console.log('game', game);

  const gameStates = [
    'Uninitialized',
    'Bet',
    'Hash',
    'Seed',
    'Reveal',
    'Withdraw',
  ];
  return {
    state: gameStates[game.state],
    player: new PublicKey(game.player),
    seed: game.seed,
    casinoSeedHash: game.casinoSeedHash,
    lockInSlot: game.lockInSlot,
    betLamports: game.betLamports,
    rollUnder: game.rollUnder,
    previousGamePublicKey: new PublicKey(game.previousGamePublicKey),
    numberGame: game.numberGame,
    roll: game.roll,
    rewardLamports: game.rewardLamports,
    publicKey: publicKey,
  };
}

export function deserializeDashboard(accountInfo) {
  const dashboardLayout = BufferLayout.struct([
    BufferLayout.u32('initComplete'),
    BufferLayout.u32('countGames'),
    publicKeyLayout('casinoPublicKey'),
    publicKeyLayout('currentGamePublicKey'),
  ]);
  const dashboard = dashboardLayout.decode(accountInfo.data);
  return assign(dashboard, {
    casinoPublicKey: new PublicKey(dashboard.casinoPublicKey),
    currentGamePublicKey: new PublicKey(dashboard.currentGamePublicKey),
  });
}
