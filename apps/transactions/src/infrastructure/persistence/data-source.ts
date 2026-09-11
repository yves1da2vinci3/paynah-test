import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.TRANSACTIONS_DB_HOST ?? 'localhost',
  port: Number(process.env.TRANSACTIONS_DB_PORT ?? 5435),
  username: process.env.TRANSACTIONS_DB_USER ?? 'transactions',
  password: process.env.TRANSACTIONS_DB_PASSWORD ?? 'transactions',
  database: process.env.TRANSACTIONS_DB_NAME ?? 'transactions',
  entities: ['apps/transactions/src/**/*.entity.ts'],
  migrations: [
    'apps/transactions/src/infrastructure/persistence/migrations/*.ts',
  ],
});
