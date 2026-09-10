import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { TransactionsModule } from './transactions.module.js';

async function bootstrap() {
  const app = await NestFactory.create(TransactionsModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.TRANSACTIONS_PORT ?? 3003);
}
await bootstrap();
