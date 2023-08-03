import {
  Mina,
  method,
  UInt32,
  PrivateKey,
  AccountUpdate,
  MerkleWitness,
  Field,
  State,
  state,
  CircuitString,
  SmartContract,
} from 'snarkyjs';
import { Schema, ZKDatabaseStorage } from '../core/index.js';

const doProofs = false;

const merkleHeight = 8;

class MyMerkleWitness extends MerkleWitness(merkleHeight) {}

const AccountSchema = {
  accountName: CircuitString,
  balance: UInt32,
};

class Account extends Schema(AccountSchema) {
  static deserialize(data: Uint8Array): Account {
    return new Account(Account.decode(data));
  }

  index(): { accountName: string } {
    return {
      accountName: this.accountName.toString(),
    };
  }

  json(): { accountName: string; balance: string } {
    return {
      accountName: this.accountName.toString(),
      balance: this.balance.toString(),
    };
  }
}

let initialCommitment: Field;

class PigletBank extends SmartContract {
  @state(Field) root = State<Field>();

  @method init() {
    super.init();
    this.root.set(initialCommitment);
  }

  /**
   * Todo provide acuumulation of multiple records
   * @param oldRecord
   * @param newRecord
   * @param merkleWitness
   */
  @method
  trasnfer(
    from: Account,
    fromWitness: MyMerkleWitness,
    to: Account,
    toWitness: MyMerkleWitness,
    value: UInt32
  ) {
    // We fetch the on-chain merkle root commitment,
    // Make sure it matches the one we have locally
    let commitment = this.root.get();
    this.root.assertEquals(commitment);

    // Make sure that from account is within the committed Merkle Tree
    fromWitness.calculateRoot(from.hash()).assertEquals(commitment);

    // We calculate the new Merkle Root, based on the record changes
    let newCommitment = fromWitness.calculateRoot(
      new Account({
        accountName: from.accountName,
        balance: from.balance.sub(value),
      }).hash()
    );

    // Make sure that to account is within the committed Merkle Tree
    toWitness.calculateRoot(to.hash()).assertEquals(newCommitment);

    // We calculate the new Merkle Root, based on the record changes
    newCommitment = toWitness.calculateRoot(
      new Account({
        accountName: to.accountName,
        balance: to.balance.add(value),
      }).hash()
    );

    // Update the root state
    this.root.set(newCommitment);
  }
}

(async () => {
  type TNames = 'Bob' | 'Alice' | 'Charlie' | 'Olivia';
  const accountNameList: TNames[] = ['Bob', 'Alice', 'Charlie', 'Olivia'];

  let Local = Mina.LocalBlockchain({ proofsEnabled: doProofs });
  Mina.setActiveInstance(Local);
  let initialBalance = 10_000_000_000;

  let feePayerKey = Local.testAccounts[0].privateKey;
  let feePayer = Local.testAccounts[0].publicKey;

  // the zkapp account
  let zkappKey = PrivateKey.random();
  let zkappAddress = zkappKey.toPublicKey();

  // we now need "wrap" the Merkle tree around our off-chain storage
  // we initialize a new Merkle Tree with height 8
  const zkdb = await ZKDatabaseStorage.getInstance(8);
  for (let i = 0; i < accountNameList.length; i++) {
    const findRecord = zkdb.findOne('accountName', accountNameList[i]);
    if (findRecord.isEmpty()) {
      await zkdb.add(
        new Account({
          accountName: CircuitString.fromString(accountNameList[i]),
          balance: UInt32.from(10000000),
        })
      );
      console.log(
        `Account ${accountNameList[i]} created, balance: ${10000000}`
      );
    } else {
      const account = await findRecord.load(Account);
      console.log(
        `Load account ${
          accountNameList[i]
        }, balance: ${account.balance.toString()}`
      );
    }
  }

  initialCommitment = await zkdb.getMerkleRoot();
  console.log('Initial root:', initialCommitment.toString());

  let zkAppPigletBank = new PigletBank(zkappAddress);
  console.log('Deploying Piglet Bank..');
  if (doProofs) {
    await PigletBank.compile();
  }
  let tx = await Mina.transaction(feePayer, () => {
    AccountUpdate.fundNewAccount(feePayer).send({
      to: zkappAddress,
      amount: initialBalance,
    });
    zkAppPigletBank.deploy();
  });
  await tx.prove();
  await tx.sign([feePayerKey, zkappKey]).send();

  console.log('Do transaction..');
  await transfer('Bob', 'Alice', 132);
  await transfer('Alice', 'Charlie', 44);
  await transfer('Charlie', 'Olivia', 82);
  await transfer('Olivia', 'Bob', 50);

  for (let i = 0; i < accountNameList.length; i++) {
    const findResult = await zkdb.findOne('accountName', accountNameList[i]);
    if (!findResult.isEmpty()) {
      const account = await findResult.load(Account);
      const { accountName, balance } = account.json();
      console.log(`Final balance of ${accountName} :`, balance);
    }
  }

  async function transfer(fromName: TNames, toName: TNames, value: number) {
    console.log(`Transfer from ${fromName} to ${toName} with ${value}..`);

    const findFromAccount = await zkdb.findOne('accountName', fromName);
    const from = await findFromAccount.load(Account);

    const fromWitness = new MyMerkleWitness(await findFromAccount.witness());
    await findFromAccount.update(
      new Account({
        accountName: from.accountName,
        balance: from.balance.sub(value),
      })
    );

    const findToAccount = await zkdb.findOne('accountName', toName);
    const to = await findToAccount.load(Account);

    const toWitness = new MyMerkleWitness(await findToAccount.witness());
    await findToAccount.update(
      new Account({
        accountName: to.accountName,
        balance: to.balance.add(value),
      })
    );

    let tx = await Mina.transaction(feePayer, () => {
      zkAppPigletBank.trasnfer(
        from,
        fromWitness,
        to,
        toWitness,
        UInt32.from(value)
      );
    });
    await tx.prove();
    await tx.sign([feePayerKey, zkappKey]).send();

    zkAppPigletBank.root.get().assertEquals(await zkdb.getMerkleRoot());
  }
})();