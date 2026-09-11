import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL ?? 'amqp://paynah:paynah@localhost:5672'],
      queue: 'transactions.payments',
      queueOptions: { durable: true },
      exchange: 'payments.events',
      exchangeType: 'topic',
      wildcards: true,
      noAck: false,
    },
  });

  await app.startAllMicroservices();
  await app.listen(process.env.TRANSACTIONS_PORT ?? 3003);
}
await bootstrap();
