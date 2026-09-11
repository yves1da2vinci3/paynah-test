import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1789124487793 implements MigrationInterface {
    name = 'Init1789124487793'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
        await queryRunner.query(`CREATE TABLE "transactions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "operation_id" character varying(128) NOT NULL, "event_id" uuid, "payment_id" uuid, "account_id" uuid NOT NULL, "wallet_id" uuid NOT NULL, "counterparty_wallet_id" uuid, "direction" character varying(8) NOT NULL, "amount_minor" bigint NOT NULL, "currency" character(3) NOT NULL, "status" character varying(32) NOT NULL, "correlation_id" uuid NOT NULL, "occurred_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_d5e1bb4b3b2e9b70b7eb05c57f0" UNIQUE ("operation_id"), CONSTRAINT "UQ_4668f10567279f094acb4d17437" UNIQUE ("event_id"), CONSTRAINT "CHK_32b31dfe1cc0072dc1f4436eb1" CHECK ("direction" IN ('CREDIT', 'DEBIT', 'TRANSFER')), CONSTRAINT "CHK_08e91da6e07f018ca4ce13a3e8" CHECK ("amount_minor" > 0), CONSTRAINT "PK_a219afd8dd77ed80f5a862f1db9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "transactions_wallet_occurred_idx" ON "transactions" ("wallet_id", "occurred_at" DESC, "id" DESC)`);
        await queryRunner.query(`CREATE INDEX "transactions_account_occurred_idx" ON "transactions" ("account_id", "occurred_at" DESC, "id" DESC)`);
        await queryRunner.query(`CREATE TABLE "inbox" ("event_id" uuid NOT NULL, "event_type" character varying(64) NOT NULL, "payload_hash" character(64) NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_9b85eb4cab41c7c6023b1e579d0" PRIMARY KEY ("event_id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "inbox"`);
        await queryRunner.query(`DROP INDEX "public"."transactions_account_occurred_idx"`);
        await queryRunner.query(`DROP INDEX "public"."transactions_wallet_occurred_idx"`);
        await queryRunner.query(`DROP TABLE "transactions"`);
    }

}
