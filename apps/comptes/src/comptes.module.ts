import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComptesController } from './comptes.controller.js';
import { ComptesService } from './comptes.service.js';
import { validateComptesEnv } from './infrastructure/config/env.validation.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validateComptesEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.getOrThrow<string>('COMPTES_DB_HOST'),
        port: config.getOrThrow<number>('COMPTES_DB_PORT'),
        username: config.getOrThrow<string>('COMPTES_DB_USER'),
        password: config.getOrThrow<string>('COMPTES_DB_PASSWORD'),
        database: config.getOrThrow<string>('COMPTES_DB_NAME'),
        autoLoadEntities: true,
        synchronize: false,
      }),
    }),
  ],
  controllers: [ComptesController],
  providers: [ComptesService],
})
export class ComptesModule {}
