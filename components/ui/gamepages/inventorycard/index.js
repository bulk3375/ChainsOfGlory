import { Button } from "@components/ui/common";
import { OrderModal } from "@components/ui/order";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function InventoryCard({ NFT, contract, account, network }) {
  const [itemStats, setItemStats] = useState(null);
  const [itemLocalData, setItemLocalData] = useState(null);
  const [itemOriginalData, setItemOriginalData] = useState(null);

  const [refresh, setRefresh] = useState(false);

  const levels = [
    "text-slate-300",
    "text-green-500",
    "text-cyan-400",
    "text-purple-500",
    "text-pink-500",
  ];
  const levelNames = ["Common", "Rare", "Epic", "Legendary", "Mythic"];
  const slots = [
    "Head",
    "Neck",
    "Chest",
    "Belt",
    "Legs",
    "Feet",
    "Arms",
    "Weapon",
    "Complement",
    "Finger",
    "Mount",
    "Wildcard",
  ];

  const stats = [
    "Health",
    "Attack",
    "Defense",
    "Dodge",
    "Mastery",
    "Speed",
    "Luck",
    "Faith",
  ];

  function ItemLevel() {
    if (itemStats) {
      const nStats = itemStats[5][0].reduce((a, v) => (v != 0 ? a + 1 : a), 0);
      return nStats - 2;
    }
    return 0;
  }

  async function getGearJson(gearId) {
    try {
      let response = await fetch("/gamedata/equipment/" + gearId + ".json");
      let responseJson = await response.json();

      return responseJson;
    } catch (error) {
      console.error(error);
    }
  }

  function SingleStat(statIndex) {
    return (
      <>
        {itemStats[5][0][statIndex] != 0 ? (
          <span className="text-amber-300">
            {stats[statIndex]}: +
            {Math.round((itemStats[5][0][statIndex] / 100) * 100) / 100}
            <br />
          </span>
        ) : (
          <span className="text-slate-500">
            {stats[statIndex]}: 0 <br />
          </span>
        )}
      </>
    );
  }

  function displayStats() {
    return (
      <div className="tracking-wide text-sm mt-4 font-semibold text-slate-100 flex justify-between">
        <div>
          {SingleStat(0)}
          {SingleStat(2)}
          {SingleStat(4)}
          {SingleStat(6)}
        </div>
        <div>
          {SingleStat(1)}
          {SingleStat(3)}
          {SingleStat(5)}
          {SingleStat(7)}
        </div>
      </div>
    );
  }

  useEffect(async () => {
    if (account.data && network.isSupported) {
      const itemData = await contract.equipment.contract.methods
        .getGearData(NFT)
        .call();

      console.log(itemData);
      const itd = await getGearJson(itemData[0]);
      setItemLocalData(itd);
      setItemStats(itemData);

      const itemStats = await contract.gameStats.contract.methods
        .equipmentAt(itemData[0])
        .call();

      const { 0: data, 1: price } = itemStats;
      setItemOriginalData(data);
    } else {
      setItemStats(null);
    }
  }, [account.data, network.isSupported, refresh]);

  function switchRefresh() {
    setRefresh(!refresh);
  }

  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-xl shadow-md overflow-hidden max-w-md border-slate-400 border-2 p-4">
      <div className="">
        {itemLocalData != null && itemStats != null ? (
          <>
            <div
              className={`tracking-wide text-xl font-semibold ${
                levels[ItemLevel()]
              }`}
            >
              {itemLocalData.name}
            </div>
            <div className="flex mt-2">
              <img
                className="bg-gradient-to-b from-slate-900 to-slate-800 rounded-xl shadow-md overflow-hidden max-w-md border-slate-400 border-2"
                src={itemLocalData.icon}
                width={100}
                height={100}
              />
              <div className="ml-2 tracking-wide text-sm font-semibold">
                <div className="mt-1 text-yellow-400">
                  {levelNames[ItemLevel()]}
                </div>
                {itemStats && itemOriginalData && (
                  <div className="tracking-wide text-sm font-semibold text-slate-100">
                    Level: {parseInt(itemStats[1]) + 1} <br />
                    {slots[itemOriginalData[0]]}
                  </div>
                )}
                {itemStats && itemStats[3] == 0 ? (
                  <div className="mt-1 text-green-400">Not equipped</div>
                ) : (
                  <div className="mt-1 text-red-400">Equipped</div>
                )}
              </div>
            </div>
          </>
        ) : (
          ""
        )}
        {itemStats && displayStats()}

        {itemLocalData != null ? (
          <div className="tracking-wide text-sm mt-4 font-semibold text-slate-100 h-20">
            {itemLocalData.description}
          </div>
        ) : (
          ""
        )}
      </div>
      {itemStats && itemStats[3] == 0 ? (
        <div className="justify-between mt-4 align-bottom">
          <Button
            onClick={ItemLevel}
            className="text-white bg-green-600 hover:bg-green-700 w-full"
          >
            Equip Item
          </Button>
        </div>
      ) : (
        <div className="justify-between mt-4 align-bottom">
          <Button
            onClick={ItemLevel}
            className="text-white bg-red-600 hover:bg-green-700 w-full"
          >
            Unequip Item
          </Button>
        </div>
      )}
    </div>
  );
}
