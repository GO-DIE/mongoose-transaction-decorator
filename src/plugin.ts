import {
  Schema,
  Document,
  Query,
  Aggregate,
  Model,
  ClientSession,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose';
import { TRANSACTION_SESSION } from './decorator';
import { ALS } from './als';

const modelDistinct = 'distinct';
const specials = {
  documentAndQueryMiddlewares: ['remove', 'updateOne', 'deleteOne'], // 同时存在于Document和Query的中间件
  modelMethods: ['bulkSave', 'bulkWrite', 'watch', modelDistinct], // 与事务相关却无中间件可触发的model方法
};

// mongoose 中间件类型枚举
const enum middlewareTypes {
  document = 'document',
  query = 'query',
  aggregate = 'aggregate',
  model = 'model',
}

type MiddlewareType = `${middlewareTypes}`;

// 根据mongoose所有类型中间件（已剔除事务无关中间件）的配置
const middlewareGroups = {
  [middlewareTypes.document]: ['save', ...specials.documentAndQueryMiddlewares],
  [middlewareTypes.query]: [
    'count',
    'countDocuments',
    'deleteMany',
    'deleteOne',
    'estimatedDocumentCount',
    'find',
    'findOne',
    'findOneAndDelete',
    'findOneAndRemove',
    'findOneAndReplace',
    'findOneAndUpdate',
    'remove',
    'replaceOne',
    'update',
    'updateOne',
    'updateMany',
  ],
  [middlewareTypes.aggregate]: ['aggregate'],
  [middlewareTypes.model]: ['insertMany'], // mongoose model无法获取options参数，需要重写方法方式拦截处理
};

/**
 * 中间件前置钩子，为带事务相关操作的方法自动注入装饰器session
 *  - 若用户无手动设置session时，自动注入事务装饰器的session；否，则不处理
 * @param next
 */
function preCb(this: any, next: CallbackWithoutResultAndOptionalError) {
  const als = new ALS();
  const session = als.get<ClientSession>(TRANSACTION_SESSION);
  if (this instanceof Document) {
    this.$session() || this.$session(session);
  } else if (this instanceof Query) {
    this.getOptions().session || this.session(session);
  } else if (this instanceof Aggregate) {
    (this as any).options.session || this.session(session);
  }
  next();
}

/**
 * 重写由于model无法获取options参数的带事务相关的方法
 *  - 若用户无手动设置session时，自动注入事务装饰器的session；否，则不处理
 * @param schema
 * @param method
 */
function overwriteMethod(schema: Schema, method: string) {
  if ([...middlewareGroups.model, ...specials.modelMethods].includes(method)) {
    const als = new ALS();
    schema.statics[method] = function (...args: any) {
      const session = als.get<ClientSession>(TRANSACTION_SESSION);
      if (method !== modelDistinct) {
        // FIXME: Modle.distinct返回Query, 如果用户后续再继续手动Query.session(userSession)那么自动注入的session将被覆盖
        // 持续关注https://github.com/Automattic/mongoose/issues/11587，等待官方提供支持
        return Model.distinct.apply(this, args).session(session);
      } else {
        const options = args[1] || {}; // method options parameter
        if (!options?.session) {
          args[1] = Object.assign(options, { session });
        }
        return Model[method].apply(this, args);
      }
    };
  }
}

/**
 * 自动注入session的mongoose插件
 * @param schema
 */
export function transaction(schema: Schema) {
  for (const middlewareType in middlewareGroups) {
    middlewareGroups[middlewareType as MiddlewareType].forEach(method => {
      if (middlewareType === middlewareTypes.model) {
        overwriteMethod(schema, method);
      } else if (
        middlewareType === middlewareTypes.document &&
        specials.documentAndQueryMiddlewares.includes(method)
      ) {
        schema.pre(method, { document: true, query: true }, preCb);
      } else {
        schema.pre(method, preCb);
      }
    });
  }
}
