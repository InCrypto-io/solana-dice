import express from 'express';
import {findDashboard} from './config';
import {url} from '../../url';
import {Connection} from '@solana/web3.js';
import backendStore from './backend-store';
import gamesProcessor from './games-processor';
import {size} from 'lodash';

(async () => {
  const port = process.env.PORT || 9090;
  const app = express();

  const connection = new Connection(url);

  const {dashboard, casinoAccount} = await findDashboard(connection);

  gamesProcessor.init(connection, dashboard, casinoAccount);

  app.use(function (req, res, next) {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
  });

  app.get('/config', (req, res) => {
    res.send({
      casinoPublicKey: casinoAccount.publicKey.toBase58(),
      dashboardProgramID: dashboard.programId.toBase58(),
      dashboardPublicKey: dashboard.publicKey.toBase58(),
    });
  });

  app.get('/games', (req, res) => {
    res.send(backendStore.games);
  });

  app.get('/count', (req, res) => {
    res.send(String(size(backendStore.games)));
  });

  app.listen(port, function() {
    console.log(`app listening on port ${port}`);
  });
})();
