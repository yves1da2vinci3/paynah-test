import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOutbox1789126290769 implements MigrationInterface {
    name = 'AddOutbox1789126290769'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "outbox" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "event_type" character varying(64) NOT NULL, "routing_key" character varying(128) NOT NULL, "payload" jsonb NOT NULL, "correlation_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "published_at" TIMESTAMP WITH TIME ZONE, "attempts" integer NOT NULL DEFAULT '0', "last_error" text, CONSTRAINT "UQ_cc0c9e40998e45ecfc5e313429d" UNIQUE ("event_id"), CONSTRAINT "PK_340ab539f309f03bdaa14aa7649" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "outbox_unpublished_idx" ON "outbox" ("published_at", "created_at") WHERE "published_at" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."outbox_unpublished_idx"`);
        await queryRunner.query(`DROP TABLE "outbox"`);
    }

}
