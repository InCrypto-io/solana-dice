import {SystemProgram} from '@solana/web3.js';

class Budget {
  init = (connection, dashboard, casinoAccount) => {
    this.connection = connection;
    this.dashboard = dashboard;
    this.casinoAccount = casinoAccount;
  };

  requestAirdrop = async () => {
    const lamports = 300;
    await this.connection
      .requestAirdrop(this.dashboard.publicKey, lamports)
      .catch(console.error);
  };

  getBalances = async () => {
    const casinoBalance = await this.connection.getBalance(this.dashboard.publicKey)
      .catch(() => (-1));
    const ownerBalance = await this.connection.getBalance(this.casinoAccount.publicKey)
      .catch(() => (-1));

    return {
      casinoBalance,
      ownerBalance,
    };
  };

  deposit = async (amount) => {
    const transaction = SystemProgram.transfer(
      this.casinoAccount.publicKey,
      this.dashboard.publicKey,
      amount,
    );
    const signature = await this.connection.sendTransaction(
      transaction,
      this.casinoAccount,
    );
    return await this.connection.confirmTransaction(signature);
  };

  withdraw = async (amount) => {
    await this.dashboard
      .makeCasinoWithdraw(amount, this.casinoAccount)
      .catch(console.error);
  };
}

const budget = new Budget();

export default budget;
