import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ComptesModule } from './comptes.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ComptesModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.COMPTES_PORT ?? 3001);
}
await bootstrap();
