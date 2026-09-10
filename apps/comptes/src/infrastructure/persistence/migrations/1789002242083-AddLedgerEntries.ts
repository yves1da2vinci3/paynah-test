import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLedgerEntries1789002242083 implements MigrationInterface {
    name = 'AddLedgerEntries1789002242083'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "ledger_entries" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "wallet_id" uuid NOT NULL, "operation_id" character varying(128) NOT NULL, "direction" character varying(8) NOT NULL, "amount_minor" bigint NOT NULL, "currency" character(3) NOT NULL, "balance_after_minor" bigint NOT NULL, "correlation_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_6ab645e22cf50b6bdd31e1d9e43" UNIQUE ("operation_id"), CONSTRAINT "CHK_a7454747e7f887c6bf8f272b93" CHECK ("balance_after_minor" >= 0), CONSTRAINT "CHK_17f6769716fa6dee9d19bd472c" CHECK ("amount_minor" > 0), CONSTRAINT "PK_6efcb84411d3f08b08450ae75d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "ledger_entries" ADD CONSTRAINT "FK_bb5cd6d7046b98d8faabe9c18fe" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ledger_entries" DROP CONSTRAINT "FK_bb5cd6d7046b98d8faabe9c18fe"`);
        await queryRunner.query(`DROP TABLE "ledger_entries"`);
    }

}
