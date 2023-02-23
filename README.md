<p align="center">
    <img src="./assets/zkdatabase.png" alt="Zero-Knowledge Database">
</p>

## What is zkDatabase?

zkDatabase is a database that utilize Zero-Knowledge Proof (ZKP) to prove the correctness of the data and data processing. As far as we know, every [zkApp](https://minaprotocol.com/zkapps) need to manage their own on-chain and off-chain state themselves, this is costly and inefficient depend on the complexity of data's structure. We want to help other team to build their zkApp by provide the most critical component, the database.

## Motivation

**Fault Tolerance** With ZKP and merkle tree, we can easily to prove the immutability of the data but the data itself can not be accessible by everyone. It also raise an issue regarding to a single point of failure. In our conclusion, the data should be stored on an distributed storage and everyone should able to reconstruct the merkle tree themselves then the system can recover from the fault. In the future, we will develop a feature allow you to create private database.

**Structured Data & Provable Lookup** The information (the raw data) itself is meaningless without the process to create a structured and sorted data. We try to solve this by build up an engine that allow us to encode the given data into JSON or BSON document (from now, we called it document). We're also establish the ability to index your document so the lookup process can be done over a B-Tree. Of course, we need to prove the lookup process.

**Extendable** Maintaining a database not only about keep it working but also keep it evolves to adapt with the changes of your business. zkDatabase provide a proper way to manage the shapeshift of data. Now, you can focus on develop your business and let us manage it for you. If there is a feature that you think it might necessary please let us know by create an [issue](https://github.com/orochi-network/zkDatabase/issues/new).

## Current stage of development

We are a team of four (Chiro, Flash, JoeEdoh, robi) and we're participating [zkIgnite cohort 1](https://minaprotocol.com/blog/zkignite-cohort-1-program-overview). We want to provide zkDatabase as a [npm package](https://www.npmjs.com/package/zkdatabase), following features will available in `0.1.0`:

- JSON and BSON document
- Lookup the data by a single key (multiple index might need time to develop)
- Storing data and merkle tree on [IPFS](https://ipfs.tech/)

## Specification

We need your help to write the specification. The specification will be in a [different document](./specs/README.md).

## Contribute

This section will be updated soon but all contributions are welcomed, feeling free to create a [pull request](https://github.com/orochi-network/zkDatabase/pulls).

Please reach out to us on [zkDatabase @ Discord](https://discord.com/channels/1069494820386635796/1069500366145724476).

## Donation and Grants

Our financial report could be track here [zkDatabase financial report](https://docs.google.com/spreadsheets/d/14R24hdgQGp9RdkOmjAM_l3ZQiZXsbxXD06KjZ3a8Ct0/edit?usp=sharing)

## License

The source code of zkDatabase was licensed under [Apache-2.0](./LICENSE) that meant you are a co-owner of project, the ownership depends on the stake and effort that you put in this project.