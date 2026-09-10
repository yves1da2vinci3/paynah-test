import dataSource from './data-source.js';
import { User } from './entities/user.entity.js';
import { Wallet } from './entities/wallet.entity.js';

async function seed() {
  await dataSource.initialize();
  const users = dataSource.getRepository(User);
  const wallets = dataSource.getRepository(Wallet);

  const a = await users.save(users.create({ email: 'alice@paynah.test' }));
  const b = await users.save(users.create({ email: 'bob@paynah.test' }));
  const wa = await wallets.save(
    wallets.create({ userId: a.id, currency: 'XOF', balanceMinor: 10000 }),
  );
  const wb = await wallets.save(
    wallets.create({ userId: b.id, currency: 'XOF', balanceMinor: 0 }),
  );

  console.log(
    JSON.stringify(
      { alice: a.id, bob: b.id, walletA: wa.id, walletB: wb.id },
      null,
      2,
    ),
  );
  await dataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
