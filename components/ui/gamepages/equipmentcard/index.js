import { Button } from "@components/ui/common";
import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react";

export default function EquipmentCard({NFT, contract, account, network, setDoPurchase }) {

    const [itemStats, setItemStats] = useState(null);
    const [itemPrice, setItemPrice] = useState(0);

    const [refresh, setRefresh] = useState(false);

    const PurchaseGear = async () => { 
        const value = itemPrice
        setDoPurchase({
            from: account.data,
            NFT: NFT,
            price: itemPrice,
            result:null
        })
        try {
            const result = await contract.gameCoin.contract.methods.purchaseEquipment(NFT).send({from: account.data})
            
            setDoPurchase({
                from: account.data,
                NFT: NFT,
                price: itemPrice,
                result:result
            })
        }
        catch {
            console.log("Something went worng")
            setDoPurchase(null)
        }
    }

    useEffect(async () => {
        if (account.data && network.isSupported) {
        const itemData = await contract.gameCoin.contract.methods
            .getEquipmentData(NFT)
            .call();
        
            const {0: data, 1:price} = itemData
            
            setItemStats(data)
            setItemPrice(price)
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
                    {itemStats[1][0][0]!=0 && <>Health: +{itemStats[1][0][0]} <br /></>}
                    {itemStats[1][0][1]!=0 && <>Vitality: +{itemStats[1][0][1]}<br /></>}
                    {itemStats[1][0][2]!=0 && <>Attack: +{itemStats[1][0][2]}<br /></>}
                    {itemStats[1][0][3]!=0 && <>Defense: +{itemStats[1][0][3]}<br /></>}
                    {itemStats[1][0][4]!=0 && <>Mastery: +{itemStats[1][0][4]}<br /></>}
                    {itemStats[1][0][5]!=0 && <>Speed: +{itemStats[1][0][5]}<br /></>}
                    {itemStats[1][0][6]!=0 && <>Luck: +{itemStats[1][0][6]}<br /></>}
                    {itemStats[1][0][7]!=0 && <>Faith: +{itemStats[1][0][7]}<br /></>}
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
                { network.isSupported && account.data &&
                
                    <Button
                        onClick={PurchaseGear}                                
                        className="text-white bg-green-600 hover:bg-green-700">
                        Buy Gear
                    </Button>
                } 
            </div>
        </div>
        </>
    )
}