import { Button } from "@components/ui/common";
import { OrderModal } from "@components/ui/order";
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";

export default function InventoryCard({NFT, contract, account, network }) {

    const [itemStats, setItemStats] = useState(null);

    const [refresh, setRefresh] = useState(false);

    useEffect(async () => {
        if (account.data && network.isSupported) {
        const itemData = await contract.equipment.contract.methods
            .getGearData(NFT)
            .call();

            setItemStats(itemData)
        } else {
            setItemStats(null)
            setItemPrice(0)
        }
    }, [account.data, network.isSupported, refresh]);

    function switchRefresh() {
        setRefresh(!refresh);
    }

    return (
        <>
        <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-md">
            <div className="">
                <div className="flex h-full ml-8 mt-4">
                    {itemStats!=null? (
                        <>
                    hay elemento
                    </>
                    )
                    : 
                    <></>
                    }
                </div>
                <div className="p-8">
                    <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                        aaa
                    </div>
                    <Link href={`/courses/${NFT}`}>
                        <a 
                            className="block mt-1 text-lg leading-tight font-medium text-black hover:underline">
                            {NFT}
                        </a>
                    </Link>
                    <p className="mt-2 text-gray-500">
                        {NFT}
                        </p>
                </div>
                
            </div>
        </div>

        </>
    )
}