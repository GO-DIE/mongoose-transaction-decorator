mongoose-transaction-decorator
================

A transactional decorator implementation is provided for Mongoose Transactions.



# Quick Start

## Install

```
$ npm install mongoose-transaction-decorator
```



## Usage

```typescript
import {
  set,
  plugin,
  Schema,
  model,
  connect,
  connection,
  Model,
} from 'mongoose';
import {
  transaction,
  TransactionConnection,
  Transactional,
} from 'mongoose-transaction-decorator';

interface IPerson {
  name: string;
  age: number;
  gender: boolean | null;
}

class Person {
  private readonly model: Model<IPerson>;

  constructor(model: Model<IPerson>) {
    this.model = model;
  }

  // Transactional Decorator that marks the method as a transaction method.
  @Transactional()
  async fun() {
    // do some transaction operations
    const doc = new this.model({ name: 'ZhangSan', age: 18 });
    await doc.save();
    await this.model.findOne();
    return;
  }
}

async function main() {
  set('debug', true);

  // use transaction plugin to support transactional decorator
  plugin(transaction);

  await connect('mongodb://localhost:27017/test?directConnection=true');

  // set connection
  new TransactionConnection().setConnection(connection);

  const personSchema = new Schema<IPerson>({
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: Boolean, default: null },
  });

  const personModel = model('persons', personSchema);

  const person = new Person(personModel);
  await person.fun();

  await connection.close();
}

main();

```



Code execution mongoose debug logs：

```
Mongoose: persons.insertOne({ name: 'ZhangSan', age: 18, gender: null, _id: new ObjectId("6240777d8d80087294f603da"), __v: 0}, { session: ClientSession("c68b32c60cdc4f4ea0b12255954100e3") })
Mongoose: persons.findOne({}, { session: ClientSession("c68b32c60cdc4f4ea0b12255954100e3"), projection: {}})
```

All operations within a method marked by a transaction decorator become the same transaction operation.



# API

## Plugin: transaction

The mongoose plugin to support transactional decorator.

**Example:**

```typescript
import { plugin } from 'mongoose';
import { transaction } from 'mongoose-transaction-decorator';

plugin(transaction);
```



## Class: TransactionConnection

This Class configures and saves Mongoose connections for use by the transaction decorator.  

It is a Singleton Class.



### new TransactionConnection()

Creates a new instance of TransactionConnection.



### TransactionConnection.setConnection()

Name you mongoose connections.

**Parameters：**

- *connection* **\<mongoose.Connection\>**  mongoose connection
- *connectionName*? **\<mongoose.Connection\>**   Give a name for this connection, default name "default" 



**Example:**

```typescript
const transactionConnection = new TransactionConnection();

// set connection use default name "default"
transactionConnection.setConnection(connection);

// If you have multiple database connections
transactionConnection.setConnection(connection1, 'connection1');
transactionConnection.setConnection(connection2, 'connection2');
```



### TransactionConnection.getConnection()

Get mongoose connection.

**Parameters：**

- *connectionName* **\<string\>**  connection name



## Decorator: Transactional

Decorator that marks the method as a transaction method.

**note：**

- Decorator normally use dependent the transaction plugin and TransactionConnection.setConnection().

- Decorator do not affect custom transactions that exist within the decorator method.



**Parameters：**

- *connectionName*? **\<string\>**  connection name from you set by TransactionConnection.setConnection(), default name "default".

  The database connection used within the decorated method must be the same as the database connection corresponding to this connection name, otherwise a transaction exception may occur.

- *options*? **\<ClientSessionOptions\>**  Optional settings for the transaction. 



**Example:**

```typescript
class Person {
  @Transactional('connectionName')
  async fun() {
    // do some database operations
    ...;
    return;
  }
}
```

