// const TonWeb = require("tonweb");
import {
  Cell,
  Address,
  fromNano,
  parseTransaction,
  WalletV3R2Source,
  contractAddress,
  beginCell,
  toNano,
} from "ton";
import { MnemonicProvider, TonConnection } from "@ton-defi.org/ton-connection";
require("dotenv").config();
import axios from "axios";
import {
  mnemonicToEntropy,
  mnemonicToWalletKey,
} from "ton-crypto/dist/mnemonic/mnemonic";
import { WalletV4Contract, WalletV4Source } from "ton-contracts";
import { BN } from "bn.js";

const opid2str: Record<string, string> = {
  f8a7ea5: "Jetton::Transfer",
  "7362d09c": "Jetton::Transfer_Notification",
  d53276db: "Jetton:Exccess",
  "595f07bc": "Jetton::Burn",
  "178d4519": "Jetton:Internal_Transfer",
  "7bdd97de": "Jetton:Burn_Notification",
  "15": "Jetton:Jetton::Mint",
  "5fcc3d14": "NFT::Transfer",
  "2fcb26a2": "NFT::GetData",
  "1": "Wallet::install_plugin",
  "2": "Wallet::Uninstall_plugin",
};

function fopid2str(op: string) {
  return opid2str[op] ? opid2str[op] + "(" + op + ")" : op;
}

function getACell() {
  const rootCell = new Cell();

  let currCell = rootCell;

  for (let i = 0; i < 1; i++) {
    let newCell = new Cell();
    currCell.refs.push(newCell);
    currCell = newCell;

    newCell.bits.writeBuffer(
      Buffer.from(
        "2e17b6c1df874c4ef3a295889ba8dd7170bc5620606be9b7c14192c1b3c567aa",
        "hex"
      )
    );
    newCell.bits.writeBuffer(
      Buffer.from(
        "2e17b6c1df874c4ef3a295889ba8dd7170bc5620606be9b7c14192c1b3c567aa",
        "hex"
      )
    );
    newCell.bits.writeBuffer(
      Buffer.from(
        "2e17b6c1df874c4ef3a295889ba8dd7170bc5620606be9b7c14192c1b3c567aa",
        "hex"
      )
    );
  }
  return rootCell;
}

async function init() {
  const mnemonic = process.env.MNEMONIC!.split(" ");
  //   const provider = new TonWeb.HttpProvider(
  //     //'https://scalable-api.tonwhales.com/jsonRPC'
  //     "https://toncenter.com/api/v2/jsonRPC",
  //     {
  //       apiKey:
  //         "2aaf03fa2764848c89461bba015f4408207828b0e0487d68f9e35c02aaf83300",
  //     }
  //   );

  const con = new TonConnection(
    new MnemonicProvider(
      mnemonic,
      "https://scalable-api.tonwhales.com/jsonRPC"
    ),
    "https://scalable-api.tonwhales.com/jsonRPC"
  );

  con._tonClient.

  return

  const walletContract = WalletV4Contract.create(
    WalletV4Source.create({
      publicKey: (await mnemonicToWalletKey(mnemonic)).publicKey,
      workchain: 0,
    })
  );

  const a = walletContract.address;

  const b = await con._tonClient.getBalance(a);

  console.log(
    "Balance is:",
    fromNano(b.toString()),
    "TON",
    " at address:",
    a.toFriendly()
  );

  //console.log(}).toFriendly())

  const wouldBeAddress = contractAddress({
    workchain: 0,
    initialCode: beginCell().storeAddress(a).endCell(),
    initialData: beginCell().endCell(),
  });

  // await con.requestTransaction({
  //   to: wouldBeAddress,
  //   value: new BN(0),
  //   message: getACell(),
  // });

  const txns = await con._tonClient.getTransactions(a, {
    limit: 1,
    to_lt: "29152844000000",
  });

  const txn = parseTransaction(
    0,
    Cell.fromBoc(Buffer.from(txns[0].data, "base64"))[0].beginParse()
  );

  const allFees = new BN(0)
    .add(txn.fees.coins)
    // .add(txn.description.storagePhase!.storageFeesCollected)
    // // @ts-ignore
    // .add(txn.description.computePhase.gasFees)
    // // @ts-ignore
    // .add(txn.description.actionPhase.totalFwdFees)
    // // @ts-ignore
    // .add(txn.description.actionPhase.totalActionFees)
    // @ts-ignore
    .add(txn.outMessages[0].info.fwdFee);

  const allFees2 = new BN(0)
    // .add(txn.fees.coins)
    .add(txn.description.storagePhase!.storageFeesCollected)
    // @ts-ignore
    .add(txn.description.computePhase.gasFees)
    // @ts-ignore
    .add(txn.description.actionPhase.totalFwdFees)
    // @ts-ignore
    .add(txn.description.actionPhase.totalActionFees)
    // @ts-ignore
    .add(txn.outMessages[0].info.fwdFee)
    // @ts-ignore
    .add(txn.inMessage.info.importFee);

  // console.log(txn.outMessages[0].info)
  console.log(fromNano(allFees).toString());
  console.log(fromNano(allFees2).toString());
  console.log(txn.outMessages[0]!.body.beginParse().readUint(32).toString());
}

(async () => {
  await init();
})();

// const storage = new TonWeb.InMemoryBlockStorage();//console.log);

// const onBlock = async (blockHeader: any) => {

//     const workchain = blockHeader.id.workchain;

//     if( workchain == -1 )
//     return;

//     const shardId = blockHeader.id.shard;
//     const blockNumber = blockHeader.id.seqno;

//     //console.log('BLOCK ', blockHeader);

//     const blockTransactions = await tonweb.provider.getBlockTransactions(workchain, shardId, blockNumber); // todo: (tolya-yanot) incomplete is not handled in response
//     const shortTransactions = blockTransactions.transactions;
//     for (const shortTx of shortTransactions) {
//         const address = shortTx.account;

//         const txs = await tonweb.provider.getTransactions(address, 1, shortTx.lt, shortTx.hash);
//         const tx = txs[0];

//         let c = null, opid="", q_id="";
//         var aborted: boolean = false,success=false,bounce=false,bounced=false;
//         var exitcode = -1;

//         let x = tx.in_msg?.msg_data?.body;
//         if( x )
//         {
//             try{
//                 c = Cell.fromBoc(Buffer.from(x,"base64"));
//                 opid=c[0].beginParse().readUint(32).toString(16);

//                 opid = fopid2str(opid);
//                 //q_id = c[0].beginParse().readUint(32).readUint(64).toString(16);
//                 let data = parseTransaction(0, Cell.fromBoc(Buffer.from(tx.data, "base64"))[0].beginParse() );

//                 aborted = data.description.aborted

//                 success = data.description.computePhase.success
//                 exitcode = data.description.computePhase.exitCode
//                 bounce = data.inMessage.info.bounce  false
//                 bounced = data.inMessage.info.bounced   false

//             }catch(o){
//                 opid="n/a";
//             }

//         }

//         var summery = {
//             wc:workchain,
//             shardId:shardId,
//             blockNumber:blockNumber,

/*

hme_empty$0 {n:#} {X:Type} = HashmapE n X;
hme_root$1 {n:#} {X:Type} root:^(Hashmap n X) = HashmapE n X;

// How it should be
onchain#00 data:(HashMapE 256 ^ContentData) = FullContent;


// Currently implemented - WRONG
onchain#00 data:(HashMapE 256 ContentData) = FullContent;
*/