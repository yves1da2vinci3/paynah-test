import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ACCOUNTS_PORT } from './application/ports/accounts.port.js';
import { InitiatePaymentUseCase } from './application/initiate-payment.use-case.js';
import { validatePaiementsEnv } from './infrastructure/config/env.validation.js';
import { AccountsHttpClient } from './infrastructure/http/accounts.client.js';
import { PaymentsController } from './infrastructure/http/payments.controller.js';
import { PaymentEntity } from './infrastructure/persistence/entities/payment.entity.js';
import { IdempotencyKeyEntity } from './infrastructure/persistence/entities/idempotency-key.entity.js';
import { OutboxEventEntity } from './infrastructure/persistence/entities/outbox-event.entity.js';
import { PaiementsController } from './paiements.controller.js';
import { PaiementsService } from './paiements.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validatePaiementsEnv,
    }),
    HttpModule.register({ timeout: 2000, maxRedirects: 0 }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('PAIEMENTS_DB_HOST'),
        port: config.getOrThrow<number>('PAIEMENTS_DB_PORT'),
        username: config.getOrThrow<string>('PAIEMENTS_DB_USER'),
        password: config.getOrThrow<string>('PAIEMENTS_DB_PASSWORD'),
        database: config.getOrThrow<string>('PAIEMENTS_DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
    TypeOrmModule.forFeature([
      PaymentEntity,
      IdempotencyKeyEntity,
      OutboxEventEntity,
    ]),
  ],
  controllers: [PaiementsController, PaymentsController],
  providers: [
    PaiementsService,
    InitiatePaymentUseCase,
    { provide: ACCOUNTS_PORT, useClass: AccountsHttpClient },
  ],
})
export class PaiementsModule {}
