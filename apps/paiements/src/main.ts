import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { PaiementsModule } from './paiements.module.js';

async function bootstrap() {
  const app = await NestFactory.create(PaiementsModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PAIEMENTS_PORT ?? 3002);
}
await bootstrap();
