import { CacheModule } from '@nestjs/cache-manager/dist/cache.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

export const ormModule = TypeOrmModule.forRoot({
  type: 'sqlite',
  database: ':memory:',
  entities: [__dirname + '/../../src/**/*.schema{.ts,.js}'],
  synchronize: true,
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
