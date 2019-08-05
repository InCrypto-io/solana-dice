import {Store} from './store';
import {Dates} from '../util/Dates';

class BackendStore {
  games = {};
  processedStates = {};
  hashes = {};
  haveFullHistory = false;

  constructor() {
    this.store = new Store();
  }

  load = async () => {
    try {
      const data = await this.store.load('../../../server-store/backendDb.json');
      this.games = data.games || {};
      this.processedStates = data.processedStates || {};
      this.hashes = data.hashes || {};
      this.haveFullHistory = data.haveFullHistory || false;
    } catch (e) {
      this.clean();
    }
  };

  save = async () => {
    await this.store.save('../../../server-store/backendDb.json', {
      games: this.games,
      hashes: this.hashes,
      processedStates: this.processedStates,
      haveFullHistory: this.haveFullHistory,
    });
  };

  clean = () => {
    this.games = {};
    this.hashes = {};
    this.processedStates = {};
    this.haveFullHistory = false;
  };

  updateGame = game => {
    const key =
      typeof game.publicKey === 'object'
        ? game.publicKey.toBase58()
        : game.publicKey;
    this.games[key] = {
      state: game.state,
      player: game.player.toBase58(),
      seed: game.seed.toString('hex'),
      casinoSeedHash: game.casinoSeedHash.toString('hex'),
      lockInSlot: game.lockInSlot,
      betLamports: game.betLamports,
      rollUnder: game.rollUnder,
      previousGamePublicKey: game.previousGamePublicKey.toBase58(),
      publicKey: game.publicKey.toBase58(),
      numberGame: game.numberGame,
      rewardLamports: game.rewardLamports,
      roll: game.roll,
    };
  };

  setHash(hash, value) {
    this.hashes[hash] = value;
  }

  updateState = state => {
    const key =
      typeof state.publicKey === 'object'
        ? state.publicKey.toBase58()
        : state.publicKey;
    this.processedStates[key] = state;
  };

  isRecentlyProcessedState = (publicKey, state) => {
    const key =
      typeof state.publicKey === 'object' ? publicKey.toBase58() : publicKey;
    if (!(key in this.processedStates)) {
      return false;
    }
    if (this.processedStates[key].state !== state) {
      return false;
    }
    return (
      Dates.compare(
        Dates.convert(this.processedStates[key].date + Number(new Date(5 * 60 * 1000))),
        Date.now(),
      ) > 0
    );
  };
}

const backendStore = new BackendStore();
backendStore.load().catch(console.error);

export default backendStore;
