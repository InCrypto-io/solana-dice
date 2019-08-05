// @flow

import {sendAndConfirmTransaction as realSendAndConfirmTransaction} from '@solana/web3.js';
import YAML from 'json-to-pretty-yaml';

let notify = () => undefined;

export function onTransaction(callback) {
  notify = callback;
}

export async function sendAndConfirmTransaction(
  title,
  connection,
  transaction,
  ...signers
) {
  const when = Date.now();

  const signature = await realSendAndConfirmTransaction(
    connection,
    transaction,
    ...signers,
  );

  const body = {
    time: new Date(when).toString(),
    from: signers[0].publicKey.toBase58(),
    signature,
    instructions: transaction.instructions.map(i => {
      return {
        keys: i.keys.map(keyObj => keyObj.pubkey.toBase58()),
        programId: i.programId.toBase58(),
        data: '0x' + i.data.toString('hex'),
      };
    }),
  };

  notify(title, YAML.stringify(body).replace(/"/g, ''));
}
