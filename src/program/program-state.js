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
    BufferLayout.u32('lockInSlotPart1'),// 64 bit read by part
    BufferLayout.u32('lockInSlotPart2'),
    BufferLayout.u32('betLamportsPart1'),// 64 bit read by part
    BufferLayout.u32('betLamportsPart2'),
    BufferLayout.u32('rollUnder'),
    publicKeyLayout('previousGamePublicKey'),
    BufferLayout.u32('numberGame'),
    BufferLayout.u32('roll'),
    BufferLayout.u32('rewardLamportsPart1'), // 64 bit read by part
    BufferLayout.u32('rewardLamportsPart2'),
  ]);
  const game = gameLayout.decode(accountInfo.data);

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
    lockInSlot: game.lockInSlotPart1 + (game.lockInSlotPart2 << 32),
    betLamports: game.betLamportsPart1 + (game.betLamportsPart2 << 32),
    rollUnder: game.rollUnder,
    previousGamePublicKey: new PublicKey(game.previousGamePublicKey),
    numberGame: game.numberGame,
    roll: game.roll,
    rewardLamports: game.rewardLamportsPart1 + (game.rewardLamportsPart2 << 32),
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
