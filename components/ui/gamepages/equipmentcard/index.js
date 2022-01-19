import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";

export default function EquipmentCard({NFT, contract, account, network }) {

    const [itemStats, setItemStats] = useState(null);
    const [itemPrice, setItemPrice] = useState(0);

    const [refresh, setRefresh] = useState(false);

    useEffect(async () => {
        if (account.data && network.isSupported) {
        const itemData = await contract.gameCoin.contract.methods
            .getEquipmentData(NFT)
            .call();
        
            const {0: data, 1:price} = itemData
            
            console.log({data, price})
            setItemStats(data)
            setItemPrice(price)
            console.log(data[1])
        } else {
            setItemStats(null)
            setItemPrice(0)
        }
    }, [account.data, network.isSupported, refresh]);

    function switchRefresh() {
        setRefresh(!refresh);
    }

    return (
        <div className="bg-white rounded-xl shadow-md overflow-hidden max-w-md">
            <div className="flex h-full">
            <div className="flex h-full">
                {itemStats!=null? (
                    <>
                Health: +{itemStats[1][0][0]} <br />
                Vitality: +{itemStats[1][0][1]}<br />
                Attack: +{itemStats[1][0][2]}<br />
                Defense: +{itemStats[1][0][3]}<br />
                Mastery: +{itemStats[1][0][4]}<br />
                Speed: +{itemStats[1][0][5]}<br />
                Luck: +{itemStats[1][0][6]}<br />
                Faith: +{itemStats[1][0][7]}<br />
                </>
                )
                : 
                <></>
                }
            </div>
            <div className="p-8">
                <div className="uppercase tracking-wide text-sm text-indigo-500 font-semibold">
                    {itemPrice}
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

    )
}