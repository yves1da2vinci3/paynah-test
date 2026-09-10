import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaiementsController } from './paiements.controller.js';
import { PaiementsService } from './paiements.service.js';
import { validatePaiementsEnv } from './infrastructure/config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validatePaiementsEnv,
    }),
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
  ],
  controllers: [PaiementsController],
  providers: [PaiementsService],
})
export class PaiementsModule {}
