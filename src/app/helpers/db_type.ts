import * as dotenv from 'dotenv';

if (process.env.NODE_ENV != 'jest')
  dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

export const MONGO = process.env.DB_TYPE === 'mongodb';
