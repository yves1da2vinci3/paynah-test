import { MigrationInterface, QueryRunner } from "typeorm";

export class InitPayments1789073496773 implements MigrationInterface {
    name = 'InitPayments1789073496773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "source_account_id" uuid NOT NULL, "destination_account_id" uuid NOT NULL, "amount_minor" bigint NOT NULL, "currency" character(3) NOT NULL, "status" character varying(32) NOT NULL, "failure_code" character varying(64), "correlation_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_8ef122fc39f116f537cd560b9a" CHECK ("source_account_id" <> "destination_account_id"), CONSTRAINT "CHK_b8f116e529193770b4ddce866d" CHECK ("amount_minor" > 0), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "payments"`);
    }

}
