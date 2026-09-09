import { NestFactory } from '@nestjs/core';
import { TransactionsModule } from './transactions.module.js';

async function bootstrap() {
  const app = await NestFactory.create(TransactionsModule);
  await app.listen(process.env.port ?? 3003);
}
await bootstrap();
