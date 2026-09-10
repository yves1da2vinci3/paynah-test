import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.COMPTES_DB_HOST ?? 'localhost',
  port: Number(process.env.COMPTES_DB_PORT ?? 5433),
  username: process.env.COMPTES_DB_USER ?? 'comptes',
  password: process.env.COMPTES_DB_PASSWORD ?? 'comptes',
  database: process.env.COMPTES_DB_NAME ?? 'comptes',
  entities: ['apps/comptes/src/**/*.entity.ts'],
  migrations: ['apps/comptes/src/infrastructure/persistence/migrations/*.ts'],
});
