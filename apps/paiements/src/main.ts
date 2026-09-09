import { NestFactory } from '@nestjs/core';
import { PaiementsModule } from './paiements.module.js';

async function bootstrap() {
  const app = await NestFactory.create(PaiementsModule);
  await app.listen(process.env.port ?? 3002);
}
await bootstrap();
