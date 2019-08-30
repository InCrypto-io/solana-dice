import express from 'express';
import {findDashboard} from './config';
import {url} from '../../url';
import {Connection} from '@solana/web3.js';
import backendStore from './backend-store';
import bodyParser from 'body-parser';
import gamesProcessor from './games-processor';
import budget from './budget';

(async () => {
  const port = process.env.PORT || 9090;
  const app = express();

  const connection = new Connection(url);

  const {dashboard, casinoAccount} = await findDashboard(connection);

  gamesProcessor.init(connection, dashboard, casinoAccount);
  budget.init(connection, dashboard, casinoAccount);

  app.use(bodyParser.urlencoded({extended: true}));

  app.use(function(req, res, next) {
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

  app.get('/balance', async (req, res) => {
    res.send(await budget.getBalances());
  });

  const password = process.env['RPC_PASSWORD'] || '123';
  app.post('/deposit', async (req, res) => {
    if (req.body.password === password) {
      const result = await budget.deposit(req.body.amount)
        .then(() => ('ok'))
        .catch(() => ('fail'));
      res.send({
        result,
      });
    } else {
      res.status(403).send({
        message: 'wrong password',
      });
    }
  });

  app.post('/withdraw', async (req, res) => {
    if (req.body.password === password) {
      const result = await budget.withdraw(req.body.amount)
        .then(() => ('ok'))
        .catch(() => ('fail'));
      res.send({
        result,
      });
    } else {
      res.status(403).send({
        message: 'wrong password',
      });
    }
  });

  app.listen(port, '0.0.0.0', function() {
    console.log(`app listening on port ${port}`);
  });
})();
