import { Connection } from 'mongoose';

export const DEFAULT_NAME = 'default';

export class TransactionConnection {
  private static instance: TransactionConnection = new TransactionConnection();
  private _connections: { [K: string]: Connection } = {};

  constructor() {
    return TransactionConnection.instance;
  }

  setConnection(connection: Connection, connectionName = DEFAULT_NAME) {
    this._connections[connectionName] = connection;
  }

  getConnection(connectionName: string) {
    return this._connections[connectionName];
  }
}
