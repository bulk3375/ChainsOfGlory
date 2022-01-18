import { BaseLayout } from "@components/ui/layout";
import { WalletBar } from "@components/ui/web3";
import { useAccount, useNetwork } from "@components/hooks/web3";
import {
  Footer,
  ImageButtonBar,
  Navbar,
  NoAddress,
} from "@components/ui/common";
import {
  Auctions,
  Default,
  Heroes,
  Inventory,
  Merchant,
  Quests,
  Ranking,
} from "@components/ui/gamepages";

import React, { useState } from "react";

export default function Home() {
  const { account } = useAccount();
  const { network } = useNetwork();

  const [gameZone, setGameZone] = useState("0");

  function clickFunction(buttonId) {
    setGameZone(buttonId);
  }

  return (
    <>
      <Navbar clickFunction={clickFunction} />

      <div className="max-w-5xl mx-auto fit">
        {account.data ? (
          <div className="py-2">
            <WalletBar
              address={account.data}
              network={{
                data: network.data,
                targetNetwork: network.target,
                isSupported: network.isSupported,
                hasInitialResponse: network.hasInitialResponse,
              }}
            />
          </div>
        ) : (
          <div className="py-2">
            <NoAddress
              network={{
                data: network.data,
                targetNetwork: network.target,
                isSupported: network.isSupported,
                hasInitialResponse: network.hasInitialResponse,
              }}
            />
          </div>
        )}

        <ImageButtonBar
          clickFunction={clickFunction}
          network={{
            data: network.data,
            targetNetwork: network.target,
            isSupported: network.isSupported,
            hasInitialResponse: network.hasInitialResponse,
          }}
        />
        {gameZone == 0 ? (
          <Default clickFunction={clickFunction} />
        ) : gameZone == 1 ? (
          <Inventory clickFunction={clickFunction} />
        ) : gameZone == 2 ? (
          <Quests clickFunction={clickFunction} />
        ) : gameZone == 3 ? (
          <Heroes clickFunction={clickFunction} />
        ) : gameZone == 4 ? (
          <Merchant clickFunction={clickFunction} />
        ) : gameZone == 5 ? (
          <Ranking clickFunction={clickFunction} />
        ) : gameZone == 6 ? (
          <Auctions clickFunction={clickFunction} />
        ) : (
          <Default />
        )}
      </div>
      <Footer />
    </>
  );
}

Home.Layout = BaseLayout;
