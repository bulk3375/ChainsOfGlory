import { useWeb3 } from "@components/providers";
import { useAccount, useNetwork } from "@components/hooks/web3";
import { useState, useEffect } from "react";
import { EquipmentCard, EquipmentList } from "..";
import { OrderModal } from "@components/ui/order";

export default function Merchant() {
  const { contract } = useWeb3();
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

  const [availableItems, setAvailableItems] = useState(null);
  const [refresh, setRefresh] = useState(false);

  //Get available items
  useEffect(async () => {
    if (account.data && network.isSupported) {
      const nItems = await contract.gameCoin.contract.methods
        .getItemLength(1)
        .call()

      setAvailableItems(
        Array.apply(null, { length: nItems }).map(Number.call, Number)
      );
    } else setAvailableItems([])
  }, [account.data, network.isSupported, refresh])

  function switchRefresh() {
    setRefresh(!refresh);
  }

  function showOrderModal(value) {
    setDoPurchase(value)
  }

  const [doPurchase, setDoPurchase] = useState(null)

  return (
    <>
      <div className="mt-8"></div>
      <EquipmentList ListValues={availableItems}>
        {(NFTv) => <EquipmentCard key={NFTv} NFT={NFTv} contract={contract} account={account} network={network} setDoPurchase={showOrderModal}/>}
      </EquipmentList>
      {
          doPurchase &&
          <OrderModal
              purchase={doPurchase}
          />
      }
    </>
  );
}
