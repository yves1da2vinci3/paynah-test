import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { InjectDataSource } from '@nestjs/typeorm';
import { lastValueFrom } from 'rxjs';
import { DataSource } from 'typeorm';
import { PAYMENTS_BROKER } from './payments-broker.token.js';

type OutboxRow = {
  id: string;
  routing_key: string;
  payload: Record<string, unknown>;
};

@Injectable()
export class OutboxRelay implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelay.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  private enabled = false;

  constructor(
    private readonly config: ConfigService,
    @InjectDataSource() private readonly dataSource: DataSource,
    @Inject(PAYMENTS_BROKER) private readonly broker: ClientProxy,
  ) {}

  async onModuleInit() {
    this.enabled = this.config.getOrThrow<string>('USE_OUTBOX') === 'true';
    if (!this.enabled) {
      this.logger.log('USE_OUTBOX=false — relay disabled (REST journal fallback)');
      return;
    }
    await this.broker.connect();
    this.timer = setInterval(() => void this.tick(), 500);
  }

  async onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.enabled) {
      await this.broker.close();
    }
  }

  private async tick() {
    if (this.running) return;
    this.running = true;
    try {
      await this.dataSource.transaction(async (manager) => {
        const rows: OutboxRow[] = await manager.query(
          `SELECT id, routing_key, payload FROM outbox
           WHERE published_at IS NULL AND attempts < 10
           ORDER BY created_at
           FOR UPDATE SKIP LOCKED
           LIMIT 50`,
        );

        for (const row of rows) {
          try {
            await lastValueFrom(
              this.broker.emit(row.routing_key, row.payload),
            );
            await manager.query(
              `UPDATE outbox SET published_at = NOW(), attempts = attempts + 1 WHERE id = $1`,
              [row.id],
            );
          } catch (e) {
            this.logger.warn(
              `Outbox publish failed for ${row.id}: ${String(e)}`,
            );
            await manager.query(
              `UPDATE outbox SET attempts = attempts + 1, last_error = $2 WHERE id = $1`,
              [row.id, String(e)],
            );
          }
        }
      });
    } catch (e) {
      this.logger.error(`Outbox tick failed: ${String(e)}`);
    } finally {
      this.running = false;
    }
  }
}
