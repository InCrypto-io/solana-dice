import {url, walletURL} from '../../url';

class Wallet {
  requestType = null;
  walletWindow = null;

  handler = (option) => {
    return new Promise((resolve, reject) => {
      const makeRequest = () => {
        if (this.requestType === 1) {
          this.walletWindow.postMessage({
            method: 'addFunds',
            params: {
              pubkey: option.address,
              amount: option.amount,
              network: url,
            },
          }, walletURL);
        } else if (this.requestType === 2) {
          this.walletWindow.postMessage({
            method: 'sendCustomTransaction',
            params: {
              description: option.description,
              format: 'JSON',
              transaction: this.transactionSerialize(option.transaction),
              network: url,
            },
          }, walletURL);
        }
      };

      if (!this.walletWindow || this.walletWindow.closed) {
        this.walletWindow = window.open(walletURL, 'wallet',
          'toolbar=no, location=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=500, height=600, origin=*');
      } else {
        makeRequest();
      }

      this.walletWindow.focus();

      const windowTracker = setInterval(function() {
        if (this.walletWindow && !this.walletWindow.closed) {
          this.walletWindow = null;
          clearInterval(windowTracker);
          reject();
        }
      }, 1000);

      const listener = (e) => {
        switch (e.data.method) {
          case 'ready': {
            makeRequest();
            break;
          }
          case 'addFundsResponse':
          case 'sendCustomTransactionResponse':
            clearInterval(windowTracker);
            window.removeEventListener('message', listener);
            resolve(e.data.params);
            break;
        }
      };
      window.addEventListener('message', listener);
    });
  };

  send = (address, amount) => {
    this.requestType = 1;
    return this.handler({address, amount});
  };

  confirm = (transaction, description) => {
    this.requestType = 2;
    return this.handler({transaction, description});
  };

  transactionSerialize = (transaction) => {
    const results = [];

    if (transaction && transaction.instructions) {
      transaction.instructions.map(instruction => {
        const result = {};
        const keys = [];

        instruction.keys.map(key => {
          keys.push({
            pubkey: key.pubkey.toString(),
            isSigner: key.isSigner,
            isDebitable: key.isDebitable,
          });
        });

        result.keys = keys;
        result.programId = instruction.programId.toString();
        result.data = instruction.data.toString('hex');
        results.push(result);
      });
    }

    return JSON.stringify(results, null, 4);
  };
}

const wallet = new Wallet();
export default wallet;