import { ALS } from './als';
import { DEFAULT_NAME, TransactionConnection } from './transaction-connection';
import { ConnectionNotExistError } from './error';
import { ClientSessionOptions, MongoServerError } from 'mongodb';

export const TRANSACTION_SESSION = Symbol('TRANSACTION_SESSION');

export function Transactional(connectionName?: string);
export function Transactional(options?: ClientSessionOptions);
export function Transactional(
  connectionName?: string,
  options?: ClientSessionOptions,
);
export function Transactional(...args: any[]) {
  let connectionName = DEFAULT_NAME;
  let options: ClientSessionOptions;

  if (args.length === 1) {
    if (typeof args[0] === 'string') {
      connectionName = args[0];
    } else {
      options = args[0];
    }
  } else if (args.length === 2) {
    [connectionName, options] = args;
  }

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const als = new ALS();
    descriptor.value = async function (...args: any[]) {
      return await als.run(async () => {
        const connection = new TransactionConnection().getConnection(
          connectionName,
        );
        if (!connection) {
          throw new ConnectionNotExistError();
        }

        const session = await connection.startSession(options);
        als.set(TRANSACTION_SESSION, session);
        session.startTransaction();
        try {
          const result = await originalMethod.apply(this, args);
          await session.commitTransaction();
          return result;
        } catch (e) {
          // 若使用了错误数据库连接创建事务提交，则直接抛出异常结果，否则session.abortTransaction()将产生新的异常覆盖原有异常
          if (!(e instanceof MongoServerError)) {
            await session.abortTransaction();
          }
          throw e;
        } finally {
          session.endSession();
        }
      });
    };
    return descriptor;
  };
}
