let { ethers } = require("ethers");
let SmartPrompt = require("smartprompt");
let detectEthereumProvider = require("@metamask/detect-provider");
let { isMobile } = require("./utils");

let getRPCs = (infuraKey) => ([
    {
        rpcUrl: "https://mainnet.infura.io/v3/" + infuraKey,
        chainId: 1,
        networkName: "Ethereum Mainnet"
    },
    {
        rpcUrl: "https://rinkeby.infura.io/v3/" + infuraKey,
        chainId: 4,
        networkName: "Ethereum Testnet"
    },
    {
        rpcUrl: "https://bsc-dataseed.binance.org/",
        chainId: 56,
        networkName: "Binance Mainnet"
    },
    {
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        chainId: 97,
        networkName: "Binance Testnet"
    },
    {
        rpcUrl: "https://rpc-mainnet.maticvigil.com/",
        chainId: 187,
        networkName: "Polygon Mainnet"
    },
    {
        rpcUrl: "https://rpc-mumbai.matic.today/",
        chainId: 80001,
        networkName: "Polygon Testnet"
    }
]);

// let DemoWallet = {
//     display: {
//         logo: "[[logo]]",
//         name: "[[name]]",
//         description: "[[description]]"
//     },
//     options: undefined,
//     package: undefined,
//     connector: async (pkg, opts) => {
//         // Get the provider
//         // Get the signer
//         return {
//             provider,
//             signer,
//             getNetwork,
//             getAccounts
//         };
//     }
// };

// An injected provider is any provider put by an app/browser inside either ethereum or web3 property of the window object. It's usually a provider injected by in-wallet browser on mobile
let InjectedProviderCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/in-wallet.svg",
        name: "In-wallet browser",
        description: "Connect with an in-wallet browser"
    },
    options: null,
    package: null,
    connector: async () => {
        let provider = null;
        if (typeof window.ethereum !== 'undefined') {
            provider = window.ethereum;
            try {
                await provider.request({ method: 'eth_requestAccounts' })
            } catch (error) {
                throw new Error("User Rejected");
            }
        } else if (window.web3) {
            provider = window.web3.currentProvider;
        } else {
            throw new Error("No Provider found");
        }

        // Get ethers provider and signer
        let ethersProvider = new ethers.providers.Web3Provider(provider, "any");
        let signer = ethersProvider.getSigner();

        return {
            provider: ethersProvider,
            signer,
            getNetwork: ethersProvider.getNetwork.bind(ethersProvider),
            getAccounts: ethersProvider.listAccounts.bind(ethersProvider)
        };
    }
};

let MetaMaskCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/metamask.svg",
        name: "MetaMask",
        description: "Connect with MetaMask"
    },
    options: null,
    package: null,
    connector: async () => {
        let provider = await detectEthereumProvider();
        if (!provider) {
            throw new Error("MetaMask was not found.");
        }
        try {
            await provider.request({ method: 'eth_requestAccounts' });
        } catch (error) {
            throw new Error("User rejected.");
        }

        // Get ethers provider and signer
        let ethersProvider = new ethers.providers.Web3Provider(provider, "any");
        let signer = ethersProvider.getSigner();

        return {
            provider: ethersProvider,
            signer,
            getNetwork: ethersProvider.getNetwork.bind(ethersProvider),
            getAccounts: ethersProvider.listAccounts.bind(ethersProvider)
        };
    }
};

let BinanceCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/binance.svg",
        name: "Binance Wallet",
        description: "Connect with Binance Wallet"
    },
    options: null,
    package: null,
    connector: async () => {
        let provider = null;
        if (window.BinanceChain) {
            provider = window.BinanceChain;
            try {
                await provider.request({ method: 'eth_requestAccounts' });
            } catch (error) {
                throw new Error("User rejected.");
            }
        } else {
            throw new Error("Binance Wallet was not found.");
        }

        // Get ethers provider and signer
        let ethersProvider = new ethers.providers.Web3Provider(provider, "any");
        let signer = ethersProvider.getSigner();

        return {
            provider: ethersProvider,
            signer,
            getNetwork: ethersProvider.getNetwork.bind(ethersProvider),
            getAccounts: ethersProvider.listAccounts.bind(ethersProvider)
        };
    }
};

let CoinbaseCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/coinbase.svg",
        name: "Coinbase Wallet",
        description: "Connect with Coinbase Wallet"
    },
    options: {
        appName: undefined,
        infuraApiKey: undefined
    },
    package: undefined,
    connector: async (pkg, opts) => {

        if (opts.appName === undefined) {
            throw new Error("You must specify appName property in options.");
        }

        if (opts.infuraApiKey === undefined) {
            throw new Error("You must specify infuraApiKey property in options.");
        }

        if (pkg === undefined) {
            throw new Error("Missing dependency, you must set package property as the following package: https://www.npmjs.com/package/walletlink");
        }

        // Spawn a modal and ask the user to which network to connect
        let prompt = await new SmartPrompt();

        let rpcOptionsTemplate = getRPCs(opts.infuraApiKey)
            .map(({ rpcUrl, chainId, networkName }) =>
                `<option value="${rpcUrl};${chainId}">${networkName}</option>`
            )
            .join("");

        prompt.init({
            figureColor: "#2d2f31",
            groundColor: "#fafafa",
            title: "WalletLink - Choose a network",
            template: `<div style="display: grid; grid-gap: 1rem;">
<div>
    <p>
        <label>Network</label>
    </p>
    <select name="networkString" required="true">
        ${rpcOptionsTemplate}
    </select>
</div>
</div>`
        });

        let result = await prompt.spawn();

        let [networkUrl, chainId] = result.networkString.split(";");

        let { appName } = opts;
        let walletLink = new pkg({ appName });
        let provider = walletLink.makeWeb3Provider(networkUrl, chainId);
        await provider.enable();

        // Get ethers provider and signer
        let ethersProvider = new ethers.providers.Web3Provider(provider, "any");
        let signer = ethersProvider.getSigner();

        return {
            provider: ethersProvider,
            signer,
            getNetwork: () => ({ chainId }),
            getAccounts: ethersProvider.listAccounts.bind(ethersProvider)
        };
    }
};

let FortmaticCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/fortmatic.svg",
        name: "Fortmatic",
        description: "Connect with Fortmatic"
    },
    options: {
        fortmaticApiKey: undefined,
        infuraApiKey: undefined
    },
    package: undefined,
    connector: async (pkg, opts) => {

        if (opts.fortmaticApiKey === undefined) {
            throw new Error("You must specify fortmaticApiKey property in options.");
        }

        if (opts.infuraApiKey === undefined) {
            throw new Error("You must specify infuraApiKey property in options.");
        }

        if (pkg === undefined) {
            throw new Error("Missing dependency, you must set package property as the following package: https://www.npmjs.com/package/fortmatic");
        }

        // Spawn a modal and ask the user to which network to connect
        let prompt = await new SmartPrompt();

        let rpcOptionsTemplate = getRPCs(opts.infuraApiKey)
            .map(({ rpcUrl, chainId, networkName }) =>
                `<option value="${rpcUrl};${chainId}">${networkName}</option>`
            )
            .join("");

        prompt.init({
            figureColor: "#2d2f31",
            groundColor: "#fafafa",
            title: "Fortmatic - Choose a network",
            template: `<div style="display: grid; grid-gap: 1rem;">
<div>
    <p>
        <label>Network</label>
    </p>
    <select name="networkString" required="true">
        ${rpcOptionsTemplate}
    </select>
</div>
</div>`
        });

        let result = await prompt.spawn();

        let [rpcUrl, chainId] = result.networkString.split(";");

        let fm = new pkg(opts.fortmaticApiKey, { rpcUrl, chainId });

        // Get ethers provider and signer
        let ethersProvider = new ethers.providers.Web3Provider(fm.getProvider(), "any");
        let signer = ethersProvider.getSigner();

        return {
            provider: ethersProvider,
            signer,
            getNetwork: () => ({ chainId }),
            getAccounts: ethersProvider.listAccounts.bind(ethersProvider)
        };
    }
};

let WalletConnectCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/walletconnect.svg",
        name: "WalletConnect",
        description: "Connect with WalletConnect"
    },
    options: {
        infuraApiKey: undefined
    },
    package: undefined,
    connector: async (pkg, opts) => {

        if (opts.infuraApiKey === undefined) {
            throw new Error("You must specify infuraApiKey property in options.");
        }

        if (pkg === undefined) {
            throw new Error("Missing dependency, you must set package property as the following package: https://www.npmjs.com/package/@walletconnect/web3-provider");
        }

        // Spawn a modal and ask the user to which network to connect
        let prompt = await new SmartPrompt();

        let rpcOptionsTemplate = getRPCs(opts.infuraApiKey)
            .map(({ rpcUrl, chainId, networkName }) =>
                `<option value="${rpcUrl};${chainId}">${networkName}</option>`
            )
            .join("");

        prompt.init({
            figureColor: "#2d2f31",
            groundColor: "#fafafa",
            title: "WalletConnect - Choose a network",
            template: `<div style="display: grid; grid-gap: 1rem;">
<div>
    <p>
        <label>Network</label>
    </p>
    <select name="networkString" required="true">
        ${rpcOptionsTemplate}
    </select>
</div>
</div>`
        });

        let result = await prompt.spawn();

        let [_, chainId] = result.networkString.split(";");

        let RPCMapping = getRPCs(opts.infuraApiKey)
            .reduce((obj, rpc) => (obj[rpc.chainId] = rpc.rpcUrl, obj), {});

        // Create WalletConnect Provider
        let provider = new pkg({
            rpc: { ...RPCMapping },
            chainId
        });
        
        //  Enable session (triggers QR Code modal)
        await provider.enable();

        // Get ethers provider and signer
        let ethersProvider = new ethers.providers.Web3Provider(provider, "any");
        let signer = ethersProvider.getSigner();

        return {
            provider: ethersProvider,
            signer,
            getNetwork: ethersProvider.getNetwork.bind(ethersProvider),
            getAccounts: ethersProvider.listAccounts.bind(ethersProvider)
        };
    }
};

let PolkadotCfg = {
    display: {
        logo: "https://raw.githubusercontent.com/4skinSkywalker/EthersModal/main/img/polkadot.svg",
        name: "Polkadot{.js}",
        description: "Connect with Polkadot{.js}"
    },
    options: {
        appName: undefined
    },
    package: undefined,
    connector: async (pkg, opts) => {

        if (opts.appName === undefined) {
            throw new Error("You must specify appName property in options.");
        }

        if (pkg === undefined) {
            throw new Error("Missing dependency, you must set package property as an array containing the following 3 packages: 1. @polkadot/extension-dapp 2. @reef-defi/evm-provider 3. @polkadot/api");
        }

        let [polkadot_extensionDapp, reefDefi_evmProvider, polkadot_api] = pkg;

        // Return an array of all the injected sources
        // (this needs to be called first)
        let allInjected = await polkadot_extensionDapp.web3Enable(opts.appName);
        let injected;
        if (allInjected && allInjected[0] && allInjected[0].signer) {
            injected = allInjected[0].signer;
        }

        // Return an array of { address, meta: { name, source } }
        // (meta.source contains the name of the extension)
        let allAccounts = await polkadot_extensionDapp.web3Accounts();
        let accountOpts = allAccounts
            .map(acc => `<option value="${acc.address}">${acc.address}</option>`)
            .join("");

        // Spawn a modal and ask the user to which account to connect
        let prompt = await new SmartPrompt();

        prompt.init({
            figureColor: "#2d2f31",
            groundColor: "#fafafa",
            title: "Polkadot{.js} - Choose account & network",
            template: `<div style="display: grid; grid-gap: 1rem;">
<span>To connect to the Reef chain you need to pair your Polkadot address. If you didn't bind already, then follow the tutorial <a href="https://freddycorly.medium.com/create-your-reef-chain-account-6b06ad323c6" target="_blank">Create your Reef chain account</a></span>
<div>
    <p>
        <label>Account</label>
    </p>
    <select name="account" required="true">
        ${accountOpts}
    </select>
</div>
<div>
    <p>
        <label>Network</label>
    </p>
    <select name="networkString" required="true">
        <option value="wss://rpc-testnet.reefscan.com/ws;reef-testnet">Reef Testnet</option>
        <option value="wss://rpc.reefscan.com/ws;reef-mainnet">Reef Mainnet</option>
    </select>
</div>
</div>`
        });

        let { account, networkString } = await prompt.spawn();
        let [networkUrl, chainId] = networkString.split(";");

        let provider = new reefDefi_evmProvider.Provider({
            provider: new polkadot_api.WsProvider(networkUrl)
        });

        await provider.api.isReady;

        let signer = new reefDefi_evmProvider.Signer(
            provider,
            account,
            injected
        );

        if (!(await signer.isClaimed())) {
            console.log(
                "No claimed EVM account found -> claimed default EVM account: ",
                await signer.getAddress()
            );
            await signer.claimDefaultAccount();
        }

        let evmAddress = await signer.queryEvmAddress();

        return {
            provider,
            signer,
            getNetwork: () => ({ chainId }),
            getAccounts: () => evmAddress
        };
    }
};

let exportObj = {
    dictionary: {
        InjectedProviderCfg,
        MetaMaskCfg,
        BinanceCfg,
        CoinbaseCfg,
        FortmaticCfg,
        WalletConnectCfg,
        PolkadotCfg
    },
    array: [
        MetaMaskCfg,
        BinanceCfg
    ]
};

if (isMobile()) {
    exportObj.array.unshift(InjectedProviderCfg);
}

module.exports = exportObj;