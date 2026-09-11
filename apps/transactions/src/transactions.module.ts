import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordTransactionHandler } from './application/commands/record-transaction.handler.js';
import { GetTransactionHistoryHandler } from './application/queries/get-transaction-history.handler.js';
import { validateTransactionsEnv } from './infrastructure/config/env.validation.js';
import { TransactionsHttpController } from './infrastructure/http/transactions.controller.js';
import { PaymentEventsConsumer } from './infrastructure/messaging/payment.consumer.js';
import { InboxEventEntity } from './infrastructure/persistence/entities/inbox-event.entity.js';
import { TransactionEntity } from './infrastructure/persistence/entities/transaction.entity.js';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateTransactionsEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('TRANSACTIONS_DB_HOST'),
        port: config.getOrThrow<number>('TRANSACTIONS_DB_PORT'),
        username: config.getOrThrow<string>('TRANSACTIONS_DB_USER'),
        password: config.getOrThrow<string>('TRANSACTIONS_DB_PASSWORD'),
        database: config.getOrThrow<string>('TRANSACTIONS_DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([TransactionEntity, InboxEventEntity]),
  ],
  controllers: [
    TransactionsController,
    TransactionsHttpController,
    PaymentEventsConsumer,
  ],
  providers: [
    TransactionsService,
    RecordTransactionHandler,
    GetTransactionHistoryHandler,
  ],
})
export class TransactionsModule {}
