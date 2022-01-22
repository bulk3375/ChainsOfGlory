import { useWeb3 } from "@components/providers";
import { useAccount, useNetwork } from "@components/hooks/web3";
import { useState, useEffect } from "react";
import { InventoryCard, InventoryList } from "..";

export default function Inventory() {
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

  useEffect(async () => {
    if (account.data && network.isSupported) {
      const nItems = await contract.equipment.contract.methods      
        .getEquipment(account.data)
        .call();

      setAvailableItems(nItems.filter((item) => item !== "0"))
      
    } else setAvailableItems([]);
  }, [account.data, network.isSupported, refresh]);

  function switchRefresh() {
    setRefresh(!refresh);
  }

  return (
    <>
      <div className="mt-8"></div>
      <InventoryList ListValues={availableItems}>
        {(NFTv) => <InventoryCard key={NFTv} NFT={NFTv} contract={contract} account={account} network={network}/>}
      </InventoryList>
    </>
  );
}
