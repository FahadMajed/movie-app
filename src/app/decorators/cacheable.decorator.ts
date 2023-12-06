/* eslint-disable @typescript-eslint/naming-convention */
import { Cache } from 'cache-manager';

export function Cacheable(cacheOptions: {
  keyPrefix?: string;
  keyGenerator?: (...args: any[]) => string;
}) {
  return function (_: any, __: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      if (cacheOptions.keyPrefix == null && cacheOptions.keyGenerator == null) {
        throw new Error('Please provide at least one option');
      }
      let cacheKey = cacheOptions.keyPrefix;

      if (cacheOptions.keyGenerator) {
        cacheKey = cacheOptions.keyGenerator.apply(this, args);
      } else {
        cacheKey += `_${args.map((arg) => JSON.stringify(arg)).join('_')}`;
      }

      const cacheManager: Cache = this.cacheManager;

      const cachedData = await cacheManager.get<string>(cacheKey);

      if (cachedData) {
        if (typeof cachedData === 'string') {
          const deserializedData = JSON.parse(cachedData);
          return deserializedData;
        } else {
          return cachedData;
        }
      }

      // Execute the original method and serialize the result before caching
      const result = await originalMethod.apply(this, args);

      const serializedResult = JSON.stringify(result);
      if (serializedResult != 'null')
        await cacheManager.set(cacheKey, serializedResult);

      return result;
    };

    return descriptor;
  };
}
