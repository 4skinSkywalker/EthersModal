# EthersModal

EthersModal is an opinionated library to help developers add support for multiple wallets in their apps.

## Webpack

This project is built with the help of webpack.
If you make any change in the src/ folder make sure to then run `npm run build` to compile a new `main.js` inside the dist/ folder.

## What do you mean with opinionated?

By opinionated I mean that it provides a structured approach of handling the connection to a set of given wallets.
When calling the .connect() method you will receive an object with essential properties that covers 99% of the usecases:
- Ethers itself
- A provider
- A signer
- The chain id
- The selected account (the first one if multiple are present)

I choose this approach because it makes way way easier for me to implement stuff.
Obviously this is not a one-size-fits-all kind of solution, but it covers 99% of the stuff I've done in the past.
Web3Modal is more flexible, but it doesn't provide all that this library does.

Another thing that makes this very opinionated is the fact that Provider, Signer, Chain ID and Selected Account that get returned by a connection call are of type ObsCached (see below to know more) which is kind like a variable that you can listen to for changes.
This is especially useful if you want to react with your code to changes in all four above properties.

## Getting started

The easiest example you can try is using the default settings:

```js
// Make an instance of EthersModal (by default has just MetaMask and Binance Chain Wallet)
let em = new EthersModal();

(async () => {

    // await a call to the .connect() method to get a connection object
    let connection = await em.connect();

    
    // You can get the current provider
    connection.provider$.getValue();

    // You can listen for changes to the provider
    let providerSubscription = connection.provider$
        .subscribe(newProvider => { ... });

    // You can stop listening for changes to the provider
    providerSubscription.unsubscribe();


    // You can get the current signer
    connection.signer$.getValue();

    // You can listen for changes to the signer
    let signerSubscription = connection.signer$
        .subscribe(newSigner => { ... });

    // You can stop listening for changes to the signer
    signerSubscription.unsubscribe();


    // You can get the current chain id
    connection.chainId$.getValue();

    // You can listen for changes to the chain id
    let chainIdSubscription = connection.chainId$
        .subscribe(newChainId => { ... });

    // You can stop listening for changes to the chain id
    chainIdSubscription.unsubscribe();


    // You can get the current selected account
    connection.selectedAccount$.getValue();

    // You can listen for changes to the selected account
    let selectedAccountSubscription = connection.selectedAccount$
        .subscribe(newSelectedAccount => { ... });

    // You can stop listening for changes to the selected account
    selectedAccountSubscription.unsubscribe();
)();
```

## Configuration of all supported wallets

The following example show how to create an EthersModal instance with all the wallets available:

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

// Make an instance of EthersModal
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

    // await a call to the .connect() method
    let connection = await em.connect();
    console.log(connection);

)();
```

## Disconnect

Simply call `.disconnect()` on your EthersModal instance to disconnect from the wallet.
It's not a promise so you don't need to await it.

## Connection object

Here comes the very interesting part of this library: the connection object.
You may have noticed that await-ing .connect() from above examples returns this weird looking object, let's analyze it:
- ethers: Module {…}
- provider$: ObsCacher {value: u, consumers: {…}}
- signer$: ObsCacher {value: JsonRpcSigner, consumers: {…}}
- chainId$: ObsCacher {value: 4, consumers: {…}}
- selectedAccount$: ObsCacher {value: '0x168**********************************d77', consumers: {…}}

The above properties marked with `$` are of type ObsCacher, an ObsCacher is like a variable but you can subscribe to it, so that when it changes you get notified. 

The first property above (`ethers`) contains the ethers library itself, it's pretty handy to have it there, no?

The second property called `provider$` contains an `ethers.provider` instance of the wallet you are using.

The third property called `signer$` contains a ethers compatible signer for your connected account.

The fourth property is `chainId$` and contains the chain id of the network you are connected to.

The fifth and last property is `selectedAccount$` and contains your currently selected account address (or the first in case multiple accounts are connected).

## ObsCacher data type

More about this can be found in the article https://freddycorly.medium.com/my-light-js-implementation-of-rxjs-subjects-1a747dcf1839.
This data type from https://www.npmjs.com/package/bada55asyncutils is similar to an EventEmitter that keeps a registry of multiple listeners. When an event happens, e.g. new value arrives, it notifies those listeners. Not only that, it also acts as a cache that subscribers can read the latest value when they need it.

The standard API is pretty simple:
- .getValue() is used to get the last value
- .subscribe(fn) is used to add new listeners
- unsubscribe is called to remove a listener

One think to be aware of is that "unsubscribe" is not a method of the object itself, it’s the return value (of type function) from the .subscribe() method call.

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

## Contributing
Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are greatly appreciated.

Fork the Project
1. Create your Feature Branch (git checkout -b feature/SomeFeature)
2. Commit your Changes (git commit -m 'Add some SomeFeature')
3. Push to the Branch (git push origin feature/SomeFeature)
4. Open a Pull Request