import { useWeb3 } from "@components/providers";
import Link from "next/link";
import { Button, ErrorModal, MusicPlayer } from "@components/ui/common";
import { useAccount, useNetwork } from "@components/hooks/web3";
import { useState, useEffect } from "react";
import ImageButtonMini from "../imgButtonMIni";

export default function Navbar({ clickFunction = null }) {
  const { connect, isLoading, contract, requireInstall } = useWeb3();
  const { account } = useAccount();
  const { network } = useNetwork();

  const [isError, setIsError] = useState(null);

  function ErrorSample() {
    setIsError({
      address: "",
      title: "Error Title",
      errorMessage: "This is the error description.",
    });
  }

  const [ownedTokens, setOwnedTokens] = useState(0);
  const [refresh, setRefresh] = useState(false);

  useEffect(async () => {
    if (account.data && network.isSupported) {
      const oTokens = await contract.gameCoin.contract.methods
        .balanceOf(account.data)
        .call();
      setOwnedTokens(oTokens);
    } else setOwnedTokens(0);
  }, [account.data, network.isSupported, refresh]);

  function switchRefresh() {
    setRefresh(!refresh);
  }

  return (
    <>
      <section>
        <div className="relative py-2 px-4 sm:px-6 lg:px-8 bg-gray-900">
          <nav className="relative" aria-label="Global">
            <div className="flex justify-between items-center max-w-5xl mx-auto">
              <div>
                <Link href="/">
                  <a
                    className="font-medium mr-8 text-gray-400 hover:text-gray-100"
                    onClick={() => {
                      if (clickFunction != null) clickFunction(0);
                    }}
                  >
                    Home
                  </a>
                </Link>
                {account.data && (
                  <Link
                    href={
                      "https://opensea.io/" +
                      account.data +
                      "?search[sortBy]=LISTING_DATE&search[query]=My Own Satoshi"
                    }
                  >
                    <a
                      target="_blank"
                      className="font-medium mr-8 text-gray-400 hover:text-gray-100"
                    >
                      If Connected
                    </a>
                  </Link>
                )}
                {/*
                    <Link href="/specialcollection">
                      <a 
                        className="font-medium mr-8 text-gray-500 hover:text-gray-900">
                        Special Collection 
                      </a>
                    </Link>
                    */}
                <Link href="#About">
                  <a className="font-medium mr-8 text-gray-400 hover:text-gray-100">
                    About
                  </a>
                </Link>
                <Link href="#FAQ">
                  <a className="font-medium mr-8 text-gray-400 hover:text-gray-100">
                    FAQ
                  </a>
                </Link>
              </div>

              <div className="flex justify-between items-center">
                {/*
                <a
                  target="_blank"
                  onClick={ErrorSample}
                  className="font-medium mr-8 text-gray-400 hover:text-gray-100"
                >
                  Special Collection
                </a>
                */}
                {account.data && (
                  <>
                    <ImageButtonMini
                      className="mr-2"
                      image="/images/icons/refresh.png"
                      imageClick="/images/icons/refreshCl.png"
                      alt="Refresh balance"
                      buttonId="1"
                      clickFunction={switchRefresh}
                    />

                    <span className="font-medium mr-8 text-gray-200 ">
                      Balance: {ownedTokens} COG
                    </span>
                  </>
                )}

                {isLoading ? (
                  <Button
                    disabled={true}
                    onClick={connect}
                    className="text-white bg-sky-600 hover:bg-sky-700"
                  >
                    Loading...
                  </Button>
                ) : account.data ? (
                  <Button
                    hoverable={false}
                    className="cursor-default text-gray-100 bg-green-700 hover:bg-green-700"
                  >
                    Connected
                  </Button>
                ) : requireInstall ? (
                  <Button
                    onClick={() =>
                      window.open("https://metamask.io/download.html", "_blank")
                    }
                    className="px-8 py-3 border rounded-md text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700"
                  >
                    Install Metamask
                  </Button>
                ) : (
                  <Button
                    onClick={connect}
                    className="text-white bg-sky-600 hover:bg-sky-700"
                  >
                    Connect Wallet
                  </Button>
                )}
                <MusicPlayer url="/images/sounds/background2.mp3" />
              </div>
            </div>
          </nav>
        </div>
        {
          // account.data &&
          // !pathname.includes("/marketplace") &&
          // <div className="flex justify-end pt-1 sm:px-6 lg:px-8">
          //   <div className="text-white bg-indigo-600 rounded-md p-2">
          //     {account.data}
          //   </div>
          // </div>
        }
      </section>
      {isError && <ErrorModal isError={isError} />}
    </>
  );
}
