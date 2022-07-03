import {
  TonConnection,
  TonWalletProvider,
  TransactionDetails,
  Wallet,
} from "@ton-defi.org/ton-connection";
import { Address, beginCell, Cell, fromNano, parseTransaction } from "ton";
import BN from "bn.js";

class StubProvider implements TonWalletProvider {
  connect(): Promise<Wallet> {
    throw new Error("Method not implemented.");
  }
  requestTransaction(
    request: TransactionDetails,
    onSuccess?: (() => void) | undefined
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }
}

(async () => {
  const con = new TonConnection(
    new StubProvider(),
    "https://scalable-api.tonwhales.com/jsonRPC"
  );

  const knownParams = {
    minter: Address.parse("EQBb4JNqn4Z6U6-nf0cSLnOJo2dxj1QRuGoq-y6Hod72jPbl"),
    jwalletOwner: Address.parse(
      "EQBuOkznvkh_STO7F8W6FcoeYhP09jjO1OeXR2RZFkN6w7NR"
    ),
  };

  const ops = {
    send: "f8a7ea5",
    receive: "178d4519",
  };

  const toJWalletAddress = (minter: Address, owner: Address) =>
    con.makeGetCall(
      minter,
      "get_wallet_address",
      [beginCell().storeAddress(owner).endCell()],
      ([addressCell]) => (addressCell as Cell).beginParse().readAddress()!
    );

  const jWalletAddress = await toJWalletAddress(
    knownParams.minter,
    knownParams.jwalletOwner
  );

  const getBalance = (jWalletAddress: Address) =>
    con.makeGetCall(
      jWalletAddress,
      "get_wallet_data",
      [],
      ([balance]) => balance as BN
    );

  const balance = await getBalance(jWalletAddress);

  //   console.log(fromNano(balance.toString()));

  const x = con._tonClient
    .getTransactions(jWalletAddress, { limit: 10000, inclusive: true })
    .then((txns) =>
      txns
        .map((t) =>
          parseTransaction(
            0,
            Cell.fromBoc(Buffer.from(t.data, "base64"))[0].beginParse()
          )
        )
        .map((t) => {
          const sl = t.inMessage?.body.beginParse();
          if (!sl) return;

          const op = sl.readUintNumber(32).toString(16);

          // TODO filter out before block X etc.
          switch (op) {
            case ops.receive:
              sl.readUint(64);
              return fromNano(sl.readCoins().toString());
            case ops.send:
              sl.readUint(64);
              return fromNano(sl.readCoins().mul(new BN(-1)).toString());
          }
        })
    )
    .then(console.log);
})();
