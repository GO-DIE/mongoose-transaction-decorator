import { TransactionConnection } from './transaction-connection';

export class ConnectionNotExistError extends Error {
  constructor() {
    super(
      `Connection not exist, use ${TransactionConnection.name}${TransactionConnection.prototype.setConnection.name} to set connection`,
    );
  }
}
