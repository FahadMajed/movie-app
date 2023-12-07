import { CacheModule } from '@nestjs/cache-manager/dist/cache.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MongoClient } from 'mongodb';

export const ormModule = TypeOrmModule.forRoot({
  type: 'mongodb',
  url: process.env.MONGO_URI,
  entities: [__dirname + '/../../src/**/*.schema{.ts,.js}'],
  synchronize: true,
  useUnifiedTopology: true,
});

export const configModule = ConfigModule.forRoot({
  envFilePath: '.env.jest',
  isGlobal: true,
  ignoreEnvFile: process.env.CI === 'true',
});

export const cacheModule = CacheModule.register({
  isGlobal: true,
  ttl: 0,
});

// dropDatabase.ts

async function dropDatabase() {
  const client = new MongoClient(process.env.MONGO_URI);
  try {
    await client.connect();
    const dbName = new URL(process.env.MONGO_URI).pathname.substr(1);
    const db = client.db(dbName);
    await db.dropDatabase();
  } finally {
    await client.close();
  }
}

export default dropDatabase;
