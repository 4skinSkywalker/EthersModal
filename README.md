# EthersModal

EthersModal is an opinionated library to help developers add support for multiple wallets in their apps.

## Webpack

This project is built with the help of webpack.
If you make any change in the src/ folder make sure to then run `npm run build` to compile a new `main.js` inside the dist/ folder.

## What do you mean with opinionated?

By opinionated I mean that it provides a structured approach of handling the connection to a set of given wallets.
When calling the .connect() method you will receive an object with essential properties that covers 99% of the usecases:
- ethers (the library itself)
- provider$
- signer$
- chainId$
- selectedAccount$ (the first one if multiple are present)
- baseTokenBalance$ (in ether)
- isConnected$
- networkChangeNotification$ (emits when selectedAccount or chainId emit)

All the above properties are observables (either ObsCacher or ObsEmitter) which are kinda like variables that you can listen to for changes (see below to know more).
This is especially useful if you want to react with your code to changes in all the above properties.
Why did I use "$" as suffix? Because it's a convention to mark fields as observables, it's completely arbitrary.

This library is not intended to be a one-size-fits-all solution, but it covers 99% of the stuff I've done in the past.
Web3Modal is more flexible, but it doesn't provide all that this library does.

## Try it

Head over to [https://4skinskywalker.github.io/EthersModal/](https://4skinskywalker.github.io/EthersModal/) and try with MetaMask or Binance Chain wallet.

## Getting started

The easiest example you can try is with default settings:

```js
// Make an instance of EthersModal without any specification (by default just MetaMask and Binance Chain Wallet will be included)
let em = new EthersModal();

(async () => {

    // Await a call to the .connect() method to get a connection object
    let conn = await em.connect();


    // 1. Get current ethers provider
    // 2. Listen for changes of ethers provider
    // 3. Unsubscribe from 2.
    conn.provider$.getValue();
    let providerSub = conn.provider$
        .subscribe(newProvider => { ... });
    providerSub.unsubscribe();


    // 1. Get current ethers signer
    // 2. Listen for changes of ethers signer
    // 3. Unsubscribe from 2.
    conn.signer$.getValue();
    let signerSub = conn.signer$
        .subscribe(newSigner => { ... });
    signerSub.unsubscribe();


    // 1. Get current chain id
    // 2. Listen for changes of chain id
    // 3. Unsubscribe from 2.
    conn.chainId$.getValue();
    let chainIdSub = conn.chainId$
        .subscribe(newChainId => { ... });
    chainIdSub.unsubscribe();


    // 1. Get current selected account
    // 2. Listen for changes of selected account
    // 3. Unsubscribe from 2.
    conn.selectedAccount$.getValue();
    let selectedAccountSub = conn.selectedAccount$
        .subscribe(newSelectedAccount => { ... });
    selectedAccountSub.unsubscribe();


    // 1. Get current base token balance (in ether)
    // 2. Listen for changes of base token balance (in ether)
    // 3. Unsubscribe from 2.
    conn.baseTokenBalance$.getValue();
    let baseTokenBalanceSub = conn.baseTokenBalance$
        .subscribe(newBaseTokenBalance => { ... });
    baseTokenBalanceSub.unsubscribe();


    // 1. Get current boolean state of the connection
    // 2. Listen for changes of boolean state of the connection
    // 3. Unsubscribe from 2.
    conn.isConnected$.getValue();
    let isConnectedSub = conn.isConnected$
        .subscribe(newIsConnected => { ... });
    isConnectedSub.unsubscribe();


    // 1. Listen for changes of chain id or selected account
    // 2. Unsubscribe from 1.
    let networkChangeNotificationSub = conn.networkChangeNotification$
        .subscribe(({ topic, value }) => { ... });
    networkChangeNotificationSub.unsubscribe();
)();
```

## Configuration of all supported wallets

The following example show how to create an EthersModal instance with all the wallets that are available:

```js
// For Coinbase Wallet
import WalletLink from "walletlink";

// For Fortmatic
import Fortmatic from "fortmatic";

// For WalletConnect (to make this work see: https://github.com/WalletConnect/walletconnect-monorepo/issues/623)
import WalletConnectProvider from "@walletconnect/web3-provider";

// For Polkadot Wallet
import * as PolkadotExtensionDapp from "@polkadot/extension-dapp";
import * as ReefDefiEvmProvider from "@reef-defi/evm-provider";
import * as PolkadotApi from "@polkadot/api";

let myWallets = EthersModal.providers.array;

// Setup of Coinbase configurations
let coinbaseCfg = EthersModal.providers.dictionary.CoinbaseCfg;
coinbaseCfg.options.appName = "my-app";
coinbaseCfg.options.infuraApiKey = "b5b51030cf3e451bb523a3f2ca10e3ff";
coinbaseCfg.package = WalletLink;
myWallets.push(coinbaseCfg);

// Setup of Fortmatic configurations
let fortmaticCfg = EthersModal.providers.dictionary.FortmaticCfg;
fortmaticCfg.options.fortmaticApiKey = "pk_test_ADCE42E053643A95";
fortmaticCfg.options.infuraApiKey = "b5b51030cf3e451bb523a3f2ca10e3ff";
fortmaticCfg.package = Fortmatic;
myWallets.push(fortmaticCfg);

// Setup of WalletConnect configurations
let walletConnectCfg = EthersModal.providers.dictionary.WalletConnectCfg;
walletConnectCfg.options.infuraApiKey = "b5b51030cf3e451bb523a3f2ca10e3ff";
walletConnectCfg.package = WalletConnectProvider;
myWallets.push(walletConnectCfg);

// Setup of Polkadot configurations
let polkadotCfg = EthersModal.providers.dictionary.PolkadotCfg;
polkadotCfg.options.appName = "my-app";
polkadotCfg.package = [
    PolkadotExtensionDapp,
    ReefDefiEvmProvider,
    PolkadotApi
];
myWallets.push(polkadotCfg);

// Make an instance of EthersModal with providerOpts in the specification
let em = new EthersModal({
    providerOpts: myWallets
});
```

## Connect

To connect you simply istantiate EthersModal and await a call to its .connect() method:

```js
// Make an instance of EthersModal
let em = new EthersModal({
    providerOpts: myWallets
});

(async () => {

    // Await a call to the .connect() method
    let connection = await em.connect();
    console.log(connection);

)();
```

## Check connection

You can check if EthersModal is connected either manually by checking the presence of chain id and selected account, or by listening (or just getting its value) `isConnected$`.

## Disconnect

Simply call `.disconnect()` on your EthersModal instance to disconnect from the wallet.
It's not a promise so you don't need to await it.

## Connection object

Here comes the very interesting part of this library: the connection object.
You may have noticed that await-ing .connect() from above examples returns this weird looking object, let's analyze it:

1. ethers: `Module { [[ ethers library itself ]] }`,

2. signer$: `ObsCacher { value: [[ ethers signer ]] }`,

3. provider$: `ObsCacher { value: [ ethers provider ] }`,

4. baseTokenBalance$: `ObsCacher { value: '26.98899094' }`,

5. chainId$: `ObsCacher { value: 97 }`,

6. selectedAccount$: `ObsCacher { value: '0xeB3**********************************f99' }`,

7. isConnected$: `ObsCacher { value: true }`,

8. networkChangeNotification$: `ObsEmitter {}`

The above properties marked with `$` are observables (either ObsCacher or ObsEmitter). In short, an observable is like a variable but you can subscribe to it, so that when its values changes you get notified. Pretty handy, isn't it?

Let's give some more details on each and every property:

1. `ethers` contains the ethers library itself;

2. `provider$` contains an `ethers.provider` instance of the wallet you are using;

3. `signer$` contains a ethers compatible signer for your connected account;

4. `chainId$` contains the chain id of the network you are connected to;

5. `selectedAccount$` contains your currently selected account address (or the first in case multiple accounts are connected);

6. `isConnected$` contains a boolean that tells you if you are connected or not, it's derived from all the properties above;

7. `networkChangeNotification$` signals when chainId or selectedAccount have changed. It passes an object of type { topic: "chainId" | "selectedAccount", value: any } to the consumer of the event.

## ObsCacher and ObsEmitter data types

ObsEmitter is similar to an EventEmitter.

ObsEmitter API:
- .subscribe(fn) is used to add new listeners
- unsubscribe is called to remove a listener

ObsCacher acts as a cache that consumers can read the latest value when they need it.

ObsCacher API:
- .getValue() is used to get the last value
- .subscribe(fn) is used to add new listeners
- unsubscribe is called to remove a listener

One thing to be aware of is that "unsubscribe" is not a method of the object itself, it’s the return value (of type function) from the .subscribe() method call.

More about these two data types can be found in the article https://freddycorly.medium.com/my-light-js-implementation-of-rxjs-subjects-1a747dcf1839.

## How to add a new provider

To add a provider you just copy-paste the code below and fill in the blanks.
Take a look at the provider.js file in the source code to get an idea, there you can find MetaMask, Binance Wallet, Coinbase Wallet etc...

```js
let DemoWallet = {
    display: {
        logo: "[[logo]]",
        name: "[[name]]",
        description: "[[description]]"
    },
    options: undefined,
    package: undefined,
    connector: async (pkg, opts) => {
        // Get the provider
        // Get the signer
        return { 
            provider,
            signer,
            getNetwork,
            getAccounts
        };
    }
};
```

The connection property is an asynchronous function that should return ethers provider and signer, a function `getNetwork` which has to return an object of type `{ chainId: string | number }` and a function `getAccounts` that has to return either an array of addresses or a single standalone address.

## Personalization

Plenty of personalization can be integrated in this library. If you have a good idea just submit it as a feature request in the issue on GitHub.

For the time being the values you can feed to the EthersModal constructor are:

```js
let em = new EthersModal({
    providerOpts: myWallets, // Optional, dafault EthersModal.providers.array
    cacheProvider: true, // Optional, default false
    width: "80vw", // Optional, default 90vw
    maxWidth: "640px", // Optional, default 480px
    syncRate: 450 // Optional, default 1000
});
```

## Contributing
Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project
1. Create your Feature Branch (git checkout -b feature/SomeFeature)
2. Commit your Changes (git commit -m 'Add some SomeFeature')
3. Push to the Branch (git push origin feature/SomeFeature)
4. Open a Pull Request