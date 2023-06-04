import "./App.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { abi, faucetContract } from "./constants";

function App() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [withdrawError, setWithdrawError] = useState("");
  const [withdrawSucess, setWithdrawSucess] = useState("");
  const [transactionData, setTransactionData] = useState("");
  const web3ModalRef = useRef();

  const getProviderOrSigner = async (needSigner = false) => {
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Change network to Goerli");
      throw new Error("change network to Goerli");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.log(err);
    }
  };

  const getfaucet = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const faucetcontract = new Contract(faucetContract, abi, signer);
      const getfaucet = await faucetcontract.getFaucet();
      setWithdrawSucess("You have recieved some faucet!");
      setTransactionData(getfaucet.hash);
    } catch (err) {
      setWithdrawError(err.message);
      console.log(err);
    }
  };

  const renderButton = () => {
    if (walletConnected) {
      return <button className="button is-link is-small"> Connected </button>;
    } else {
      return (
        <button onClick={connectWallet} className="button is-link is-small">
          CONNECT WALLET
        </button>
      );
    }
  };

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [connectWallet]);

  return (
    <>
      <div>
        <nav className="navbar">
          <div className="container">
            <div className="navbar-brand">
              <h1 className="navbar-item is-size-4">Faucet Token </h1>
            </div>
            <div id="navbarMenu" className="navbar-menu">
              <div className="navbar-end is-align-items-center">
                {renderButton()}
              </div>
            </div>
          </div>
        </nav>
        <section className="hero is-fullheight">
          <div className="faucet-hero-body">
            <div className="container has-text-centered main-content">
              <h1 className="title is-1">Faucet</h1>
              <p className="color">Fast and reliable. 10 Faucet Token/day.</p>
              <div className="box address-box">
                <div className="columns">
                  <div className="column is-four-fifths">
                    <input
                      className="input is-medium"
                      type="text"
                      placeholder="Enter your wallet address"
                    />
                  </div>
                  <div className="column">
                    <button
                      className="button is-link is-medium"
                      onClick={getfaucet}>
                      GET FAUCET
                    </button>
                  </div>
                </div>
                <article className="panel is-grey-darker">
                  <p className="panel-heading">Transaction Data</p>
                  <div className="panel-block">
                    <p>
                      {" "}
                      {transactionData
                        ? `Transaction hash: ${transactionData}`
                        : "--"}
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

export default App;
