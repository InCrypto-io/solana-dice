/**
 * The commands (encoded as Transaction Instructions) that are accepted by the
 * DiceGame Game and Dashboard program
 *
 * @flow
 */

import * as BufferLayout from 'buffer-layout';
import {PublicKey} from '@solana/web3.js';

const COMMAND_LENGTH = 0x24;

const Command = {
  InitDashboard: 0, // Initialize a dashboard account
  MakeBet: 1,
  SetSeedHash: 2,
  SetSeed: 3,
  MakeReveal: 4,
  Withdraw: 5,
  CasinoWithdraw: 6,
};

function zeroPad(command) {
  if (command.length > COMMAND_LENGTH) {
    throw new Error(
      `command buffer too large: ${command.length} > ${COMMAND_LENGTH}`,
    );
  }
  const buffer = Buffer.alloc(COMMAND_LENGTH);
  command.copy(buffer);
  return buffer;
}

function commandWithNoArgs(command) {
  const layout = BufferLayout.struct([BufferLayout.u32('command')]);
  const buffer = Buffer.alloc(layout.span);
  layout.encode({command}, buffer);
  return zeroPad(buffer);
}

export function makeBet(betLamports, rollUnder) {
  const layout = BufferLayout.struct([
    BufferLayout.u32('command'),
    BufferLayout.nu64('betLamports'),
    BufferLayout.u8('rollUnder'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      command: Command.MakeBet,
      betLamports: betLamports,
      rollUnder,
    },
    buffer,
  );
  console.log('raw command data for makeBet ', buffer.toString('hex'));
  return zeroPad(buffer);
}

export function setSeedHash(casinoSeedHash) {
  const layout = BufferLayout.struct([
    BufferLayout.u32('command'),
    BufferLayout.blob(32, 'casinoSeedHash'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      command: Command.SetSeedHash,
      casinoSeedHash: Buffer.from(casinoSeedHash, 'hex'),
    },
    buffer,
  );
  console.log('raw command data for setSeedHash ', buffer.toString('hex'));
  return zeroPad(buffer);
}

export function setSeed(seed) {
  const layout = BufferLayout.struct([
    BufferLayout.u32('command'),
    BufferLayout.blob(16, 'seed'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      command: Command.SetSeed,
      seed: Buffer.from(seed, 'hex'),
    },
    buffer,
  );
  console.log('raw command data for setSeed ', buffer.toString('hex'));
  return zeroPad(buffer);
}

export function makeReveal(seed) {
  const layout = BufferLayout.struct([
    BufferLayout.u32('command'),
    BufferLayout.blob(16, 'seed'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      command: Command.MakeReveal,
      seed: Buffer.from(seed, 'hex'),
    },
    buffer,
  );
  console.log('raw command data for makeReveal ', buffer.toString('hex'));
  return zeroPad(buffer);
}

export function initDashboard(casinoPublicKey) {
  const layout = BufferLayout.struct([
    BufferLayout.u32('command'),
    BufferLayout.blob(32, 'casinoPublicKey'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      command: Command.InitDashboard,
      casinoPublicKey: casinoPublicKey.toBuffer(),
    },
    buffer,
  );
  console.log('raw command data for initDashboard ', buffer.toString('hex'));
  return zeroPad(buffer);
}

export function makeWithdraw() {
  return commandWithNoArgs(Command.Withdraw);
}

export function makeCasinoWithdraw(amount) {
  const layout = BufferLayout.struct([
    BufferLayout.u32('command'),
    BufferLayout.nu64('amount'),
  ]);

  const buffer = Buffer.alloc(layout.span);
  layout.encode(
    {
      command: Command.CasinoWithdraw,
      amount: amount,
    },
    buffer,
  );
  console.log('raw command data for makeReveal ', buffer.toString('hex'));
  return zeroPad(buffer);
}

/**
 * Public key that identifies the Tick Height SysCall Account Public Key
 */
export function getSyscallCurrentPublicKey() {
  return new PublicKey('SysvarC1ock11111111111111111111111111111111');
}
