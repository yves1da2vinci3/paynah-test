import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIdempotencyKeys1789122887045 implements MigrationInterface {
    name = 'AddIdempotencyKeys1789122887045'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "idempotency_keys" ("idempotency_key" character varying(128) NOT NULL, "request_hash" character(64) NOT NULL, "payment_id" uuid NOT NULL, "response_code" integer NOT NULL, "response_body" jsonb NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_da5f36a3a43a07f0a91f2ab1662" PRIMARY KEY ("idempotency_key"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "idempotency_keys"`);
    }

}
