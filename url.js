import {testnetChannelEndpoint} from '@solana/web3.js';

export let url = process.env.LIVE
  ? testnetChannelEndpoint(process.env.CHANNEL || 'beta')
  : 'http://localhost:8899';


export let backendURL = process.env.BACKEND_URL
  ? process.env.BACKEND_URL
  : 'http://127.0.0.1:9090';
