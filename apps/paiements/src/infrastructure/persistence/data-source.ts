import 'dotenv/config';
import { DataSource } from 'typeorm';

export default new DataSource({
  type: 'postgres',
  host: process.env.PAIEMENTS_DB_HOST ?? 'localhost',
  port: Number(process.env.PAIEMENTS_DB_PORT ?? 5434),
  username: process.env.PAIEMENTS_DB_USER ?? 'paiements',
  password: process.env.PAIEMENTS_DB_PASSWORD ?? 'paiements',
  database: process.env.PAIEMENTS_DB_NAME ?? 'paiements',
  entities: ['apps/paiements/src/**/*.entity.ts'],
  migrations: [
    'apps/paiements/src/infrastructure/persistence/migrations/*.ts',
  ],
});
