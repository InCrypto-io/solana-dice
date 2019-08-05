import {Connection, PublicKey} from '@solana/web3.js';
import {DiceGame} from '../program/dice';
import backendStore from './backend-store';
import {sha256} from 'js-sha256';
import {forEach, map} from 'lodash';
import {url} from '../../url';
import {sleep} from '../util/sleep';

class GamesProcessor {
  init = (connection, dashboard, casinoAccount) => {
    this.connection = connection;
    this.dashboard = dashboard;
    this.casinoAccount = casinoAccount;
    this.handleInstanceCount = 0;
    this.subscribtionsOnGames = {};

    this.subscribtionId = this.connection.onAccountChange(
      this.dashboard.publicKey,
      this.fetchAllGames,
    );

    this.update().catch(this.handleError);

    this.requestAirdrop().catch(console.error);

    this.ping();
  };

  handleError = async (error) => {
    console.error(error);
    await sleep(5000);
    await this.reconnect().catch(this.handleError);
  };

  reconnect = async () => {
    if (this.subscribtionId && !!this.connection) {
      await this.connection.removeAccountChangeListener(this.subscribtionId)
        .catch();
    }
    forEach(this.subscribtionsOnGames, async (subs) => {
      await this.connection.removeAccountChangeListener(subs)
        .catch();
    });
    this.connection = new Connection(url);
    this.subscribtionsOnGames = {};
    this.subscribtionId = this.connection.onAccountChange(
      this.dashboard.publicKey,
      this.fetchAllGames,
    );
    await this.update().catch(this.handleError);

    await this.ping();
  };

  fetchGame = async gamePublicKey => {
    if (
      this._isEmptyAddress(gamePublicKey) ||
      this._isDashboard(gamePublicKey)
    ) {
      return;
    }
    const game = new DiceGame(
      this.connection,
      this.dashboard.programId,
      this.dashboard.publicKey,
      gamePublicKey,
      null,
      this.casinoAccount,
    );
    await game.updateGameState();
    backendStore.updateGame(game.state);
    await backendStore.save().catch(this.handleError);
  };

  fetchAllGames = async () => {
    backendStore.haveFullHistory = false;
    await backendStore.save().catch(this.handleError);

    let lastGamePublicKey = this.dashboard.state.currentGamePublicKey;

    while (!this._isEmptyAddress(lastGamePublicKey)) {
      const gameId =
        typeof lastGamePublicKey == 'object'
          ? lastGamePublicKey.toBase58()
          : lastGamePublicKey;
      if (!this._isProcessed(gameId)) {
        await this.fetchGame(new PublicKey(gameId));
      }
      lastGamePublicKey = backendStore.games[gameId].previousGamePublicKey;
    }

    backendStore.haveFullHistory = true;
    await backendStore.save().catch(this.handleError);
    await this.handleGames();
  };

  update = async () => {
    await this.dashboard.updateDashboardState();
    await this.fetchAllGames();
    await this.updateUnfinishedGames();
    await this.handleGames();
  };

  _onAccountChange = async (accountInfo, publicKey) => {
    await this.fetchGame(publicKey).catch(
      console.error,
    );
    await this.handleGames();
    this.subscribeToGames();
  };

  _isDashboard(address) {
    return address.equals(this.dashboard.publicKey);
  }

  _isProcessed(address) {
    return new PublicKey(address).toBase58() in backendStore.games;
  }

  _isEmptyAddress(address) {
    const what = typeof address == 'object' ? address.toBase58() : address;
    return what === '11111111111111111111111111111111';
  }

  getHash = () => {
    const value = sha256(String(Math.random())).substr(0, 32);
    const hash = sha256(Buffer.from(value, 'hex'));
    backendStore.setHash(hash, value);
    backendStore.save().catch(console.error);
    return hash;
  };

  waitHandleQueue = () => {
    return new Promise(resolve => {
      const checker = () => {
        if (this.handleInstanceCount <= 0) {
          resolve();
        } else {
          setTimeout(checker, 500);
        }
      };
      setTimeout(checker, 500);
    });
  };

  subscribeToGames = () => {
    forEach(backendStore.games, game => {
      if (!(game.publicKey in this.subscribtionsOnGames)
        && game.state !== 'Reveal'
        && game.state !== 'Withdraw') {
        this.subscribtionsOnGames[game.publicKey] = this.connection.onAccountChange(
          new PublicKey(game.publicKey),
          (accountInfo) => (this._onAccountChange(accountInfo,
            new PublicKey(game.publicKey))),
        );
      }
    });
  };

  updateUnfinishedGames = async () => {
    await Promise.all(map(backendStore.games, async game => {
      if (game.state !== 'Reveal' && game.state !== 'Withdraw') {
        await this.fetchGame(new PublicKey(game.publicKey));
      }
    }));
  };

  handleGames = async () => {
    if (this.handleInstanceCount >= 1) {
      await this.waitHandleQueue();
    }
    this.handleInstanceCount = this.handleInstanceCount + 1;
    forEach(backendStore.games, async game => {
      if (
        game.state === 'Bet' &&
        !backendStore.isRecentlyProcessedState(game.publicKey, 'Bet')
      ) {
        backendStore.updateState({
          state: 'Bet',
          publicKey: game.publicKey,
          date: Date.now(),
        });
        await backendStore.save();
        const casinoDiceGame = new DiceGame(
          this.connection,
          this.dashboard.programId,
          this.dashboard.publicKey,
          new PublicKey(game.publicKey),
          null,
          this.casinoAccount,
        );

        await casinoDiceGame.updateGameState();

        const hash = this.getHash();

        await casinoDiceGame.setSeedHash(hash).catch(this.handleError);

        await this.requestAirdrop().catch(this.handleError);
      } else if (
        game.state === 'Seed' &&
        !backendStore.isRecentlyProcessedState(game.publicKey, 'Seed')
      ) {
        backendStore.updateState({
          state: 'Seed',
          publicKey: game.publicKey,
          date: Date.now(),
        });
        await backendStore.save();
        const casinoDiceGame = new DiceGame(
          this.connection,
          this.dashboard.programId,
          this.dashboard.publicKey,
          new PublicKey(game.publicKey),
          null,
          this.casinoAccount,
        );

        await casinoDiceGame.updateGameState();

        if (!(game.casinoSeedHash in backendStore.hashes)) {
          console.error('Unknown hash in game', game.casinoSeedHash);
          return;
        }

        await casinoDiceGame
          .makeReveal(
            this.connection,
            this.dashboard.publicKey,
            new PublicKey(game.player),
            backendStore.hashes[game.casinoSeedHash],
          )
          .catch(console.error);

        await this.requestAirdrop().catch(this.handleError);
      }
    });
    this.subscribeToGames();
    this.handleInstanceCount = this.handleInstanceCount - 1;
  };

  requestAirdrop = async () => {
    const lamports = 300;
    await this.connection
      .requestAirdrop(this.casinoAccount.publicKey, lamports)
      .catch();
  };

  ping = async  () => {
    await this.connection.getSlot()
      .then(()=>{
        setTimeout(this.ping, 3000);
      }).catch(this.handleError);
  };
}

const gamesProcessor = new GamesProcessor();

export default gamesProcessor;
