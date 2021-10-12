let { ethers } = require("ethers");
let { ObsCacher } = require("bada55asyncutils");
let providers = require("./providers");

let LS_KEY = "ETHERS_MODAL_CACHED_PROVIDER";

function EthersModal(opts = {}) {

  this.connection = {
    ethers,
    provider$: new ObsCacher(),
    signer$: new ObsCacher(),
    chainId$: new ObsCacher(),
    selectedAccount$: new ObsCacher()
  };

  this.networkChangedInterval;
  this.accountsChangedInterval;

  // Everything is "encapsulate" by this UUID
  this.uuid = Math.random().toString(36).slice(2);

  // Append this instance to the window object
  window["EthersModal" + this.uuid] = this;

  this.providerOpts = opts.providerOpts || providers;
  this.cacheProvider = opts.cacheProvider || false;

  this.width = opts.width || "90vw";
  this.maxWidth = opts.maxWidth || "480px";

  if (
    this.providerOpts.some(opt =>
      !opt.display
   || !opt.display.logo
   || !opt.display.name
   || !opt.display.description)
  ) {
    throw new Error("Provider option missing display or display.logo or display.name or display.description.");
  }
  if (this.providerOpts.some(opt => !opt.connector)) {
    throw new Error("Provider option missing connection.");
  }

  // Append the HTML to the body
  let shell = document.createElement("DIV");
  shell.innerHTML = this.getHTMLBoilerplate();
  document.body.appendChild(shell.firstElementChild);
}

EthersModal.providers = providers;

EthersModal.prototype.connect = function () {

  // Return a promise so that it can be awaited by the consumer
  return new Promise((res, rej) => {
    this.resolve = res;
    this.reject = rej;

    // Load the cached provider straight away
    if (this.cacheProvider) {
      let providerName = localStorage.getItem(LS_KEY);
      let entry = Object.entries(EthersModal.providers.dictionary)
        .find(entry => entry[0] === providerName);
      let providerOpt;
      if (entry) {
        providerOpt = entry[1];
      }
      let providerOptIndex = this.providerOpts.findIndex(po => po === providerOpt);
      if (providerOptIndex !== -1) {
        this.onWalletClick(providerOptIndex);
        return;
      }
    }

    // Show the modal
    this.fade(1);

    // Click outside to dismiss function
    document.body.querySelector(`.em${this.uuid}-wrapper`)
      .addEventListener("click", evt => {
        if (evt.target.classList.contains(`em${this.uuid}-wrapper`)) {
          this.fade(0);
          this.reject("User rejected.");
        }
      });
  });
};

EthersModal.prototype.disconnect = function () {
  this.connection.provider$.next(null);
  this.connection.signer$.next(null);
  this.connection.chainId$.next(null);
  this.connection.selectedAccount$.next(null);
  clearInterval(this.networkChangedInterval);
  clearInterval(this.accountsChangedInterval);
  this.clearCachedProvider();
};

EthersModal.prototype.clearCachedProvider = function () {
  localStorage.removeItem(LS_KEY);
};

EthersModal.prototype.onWalletClick = async function (providerOptIndex) {

  // Get the providerOpt selected by the user
  let providerOpt = this.providerOpts[providerOptIndex];

  // Await the evaluation of the connector
  let { provider, signer, getNetwork, getAccounts } = await providerOpt
    .connector(
      providerOpt.package,
      providerOpt.options
    );

  // Sync variables
  await this.syncingIntervals(getNetwork, getAccounts);

  this.connection.provider$.next(provider);
  this.connection.signer$.next(signer);

  // Cache the current provider
  if (this.cacheProvider) {
    let providerName = Object.entries(EthersModal.providers.dictionary)
      .find(entry => entry[1] === providerOpt)[0];
    localStorage.setItem(LS_KEY, providerName);
  }

  this.resolve(this.connection);
  this.fade(0);
};


EthersModal.prototype.syncingIntervals = async function (getNetwork, getAccounts) {

  let updateChainId = async () => {
    let { chainId } = await getNetwork();
    if (this.connection.chainId$.getValue() !== chainId) {
      this.connection.chainId$.next(chainId);
    }
  };
  await updateChainId();

  let updateSelectedAccount = async () => {
    let selectedAccount;
    let response = await getAccounts();
    if (Array.isArray(response)) {
      selectedAccount = response[0];
    }
    else {
      selectedAccount = response;
    }
    if (this.connection.selectedAccount$.getValue() !== selectedAccount) {
      this.connection.selectedAccount$.next(selectedAccount);
    }
  };
  await updateSelectedAccount();

  // Handles changes in network
  if (!this.networkChangedInterval) {
    this.networkChangedInterval = setInterval(() => updateChainId(), 1000);
  }

  // Handles changes in accounts
  if (!this.accountsChangedInterval) {
    this.accountsChangedInterval = setInterval(() => updateSelectedAccount(), 1000);
  }
};

EthersModal.prototype.fade = function (zeroOrOne) {
  let ethersModalWrapper = document.body.querySelector(`.em${this.uuid}-wrapper`);
  if (zeroOrOne) {
    ethersModalWrapper.classList.add(`em${this.uuid}-shown`);
    setTimeout(() =>
      ethersModalWrapper.style.opacity = zeroOrOne
      , 50);
  } else {
    ethersModalWrapper.style.opacity = zeroOrOne;
    setTimeout(() =>
      ethersModalWrapper.classList.remove(`em${this.uuid}-shown`)
      , 300);
  }
};

EthersModal.prototype.getHTMLBoilerplate = function () {

  // Boilerplate for the wallet
  let walletsHTML = this.providerOpts
    .map((opt, i) => `<div class="em${this.uuid}-wallet">
    <button onclick="window.EthersModal${this.uuid}.onWalletClick(${i})">
      <img src="${opt.display.logo}" alt="${opt.display.name} logo">
      <h2>${opt.display.name}</h2>
      <p>${opt.display.description}</p>
    </button>
  </div>`)
    .join("");

  // Boilerplate for the entire modal
  return `<div class="em${this.uuid}-wrapper">
    <style>
      body {
        overflow: hidden;
      }

      .em${this.uuid}-wrapper {
        position: fixed;
        top: 0;
        display: none;
        justify-content: center;
        align-items: center;
        width: 100vw;
        height: 100vh;
        background-image: linear-gradient(
          135deg,
          #0008,
          #fff8
        );
        opacity: 0;
        background-size: 300% 300%;
        animation: MoveBG${this.uuid} 15s ease infinite alternate;
        transition: opacity .3s ease;
      }
  
      @keyframes MoveBG${this.uuid} {
        from {
          background-position: 0% 0%;
        }
        to {
          background-position: 100% 100%;
        }
      }
      
      .em${this.uuid}-shown {
        display: grid;
      }
  
      .em${this.uuid} {
        display: grid;
        grid-template-columns: 1fr 1fr;
        width: ${this.width};
        max-width: ${this.maxWidth};
        max-height: 80%;
        border-radius: 1rem;
        background-color: #fafafa;
        box-shadow: 0 10px 20px #0006;
        overflow: auto;
      }
  
      .em${this.uuid}-wallet {
        display: grid;
        padding: .5rem;
        text-align: center;
        border-width: 2px 0 0 0;
        border-style: solid;
        border-color: #eee;
      }
  
      .em${this.uuid}-wallet button {
        padding: 1rem;
        border: 0;
        border-radius: 1rem;
        background-color: #0000;
      }
  
      .em${this.uuid}-wallet button:hover {
        background-color: #eee;
        cursor: pointer;
      }
  
      .em${this.uuid}-wallet:nth-of-type(1) {
        border-width: 0 2px 0 0!important;
      }
  
      .em${this.uuid}-wallet:nth-of-type(2) {
        border-width: 0 0 0 0!important;
      }
  
      .em${this.uuid}-wallet:nth-of-type(2n + 1) {
        border-width: 2px 2px 0 0;
      }
  
      .em${this.uuid}-wallet img {
        height: 48px;
      }
  
      .em${this.uuid}-wallet h2 {
        font-size: 1.25rem;
      }
  
      .em${this.uuid}-wallet p {
        font-size: .9rem;
        color: #aaa;
      }
      
      @media (max-width: 400px) {
        .em${this.uuid} {
          grid-template-columns: 1fr;
        }
        
        .em${this.uuid}-wallet {
          border: 0;
        }
        
        .em${this.uuid}-wallet:not(:first-child) {
          border-top: 2px solid #eee!important;
        }
        
        .em${this.uuid}-wallet img {
          height: 32px;
        }
      }
    </style>
    <div class="em${this.uuid}">
      ${walletsHTML}
    </div>
  </div>`;
};

module.exports = EthersModal;
