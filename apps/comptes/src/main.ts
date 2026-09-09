import { NestFactory } from '@nestjs/core';
import { ComptesModule } from './comptes.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ComptesModule);
  await app.listen(process.env.port ?? 3001);
}
await bootstrap();
