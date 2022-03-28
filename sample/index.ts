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
    await this.model.aggregate([{ $match: { name: 'ZhangSan' } }]);
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
