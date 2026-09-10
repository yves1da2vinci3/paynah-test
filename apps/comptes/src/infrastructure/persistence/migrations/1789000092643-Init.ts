import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1789000092643 implements MigrationInterface {
    name = 'Init1789000092643'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(320) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "currency" character(3) NOT NULL, "balance_minor" bigint NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_87fd1a36dcc4d5979379a7027c9" UNIQUE ("user_id", "currency"), CONSTRAINT "CHK_d3ad83a4bb92db7ee8ca18a32c" CHECK ("balance_minor" >= 0), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD CONSTRAINT "FK_92558c08091598f7a4439586cda" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wallets" DROP CONSTRAINT "FK_92558c08091598f7a4439586cda"`);
        await queryRunner.query(`DROP TABLE "wallets"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
