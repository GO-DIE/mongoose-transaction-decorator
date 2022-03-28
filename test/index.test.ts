import {
  set,
  plugin,
  Schema,
  model,
  connect,
  connection,
  Model,
} from 'mongoose';
import { transaction, Transactional, TransactionConnection } from '../src';

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

  @Transactional()
  async find() {
    console.log('find');
    await this.model.find();
  }
}

describe('Mongoose Transaction Decorator', () => {
  let personSchema: Schema;
  let personModel: Model<IPerson>;

  beforeAll(async () => {
    set('debug', true);
    plugin(transaction);

    await connect(
      'mongodb://localhost:27017/test?readPreference=primary&appname=MongoDB%20Compass&directConnection=true&ssl=false',
    );
    new TransactionConnection().setConnection(connection);

    personSchema = new Schema<IPerson>({
      name: { type: String, required: true },
      age: { type: Number, required: true },
      gender: { type: Boolean, default: null },
    });

    personModel = model('persons', personSchema);
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    await connection.db.dropDatabase();
  });

  test('document query middleware', async () => {
    const person = new Person(personModel);
    await person.find();
  });
});
