import { AsyncLocalStorage } from 'async_hooks';

export class ALS {
  private static instance: ALS = new ALS();
  private asyncLocalStorage = new AsyncLocalStorage<Map<any, any>>();

  constructor() {
    return ALS.instance;
  }

  async run(fn: (...args: any[]) => any): Promise<any> {
    return await this.asyncLocalStorage.run(new Map(), fn);
  }

  exit() {
    this.asyncLocalStorage.exit(() => {
      return;
    });
  }

  store() {
    return this.asyncLocalStorage.getStore();
  }

  set(key: any, value: any) {
    this.store()!.set(key, value);
  }

  get<T>(key: any): T {
    return this.store()!.get(key);
  }
}
