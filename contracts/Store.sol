//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./GameCoin.sol";
import "./Equipment.sol";

contract Store is Ownable{

    //***********************************
    // SETUP AFTER DEPLOY
    //***********************************
    //SET EQUIPMENT ADDRESS
    //SET TOKEN ADDRESS
    //SET MINTER_ROLE FOR EQUIPMENT
    //***********************************

    //Game Token Address
    Equipment private _equipment;

    //Game Token Address
    GameCoin private _gameCoin;

    //Gear offered in the stores
    //Administrators may update, delete or modify the content
    //The store should read this array and populate the store acording to it
    Equipment.gearStats[] public storeGear;

    //GameToken Token Address
    function setEquipmentAddress(address equipmentAddress) public onlyOwner {
        _equipment=Equipment(equipmentAddress);
    }

    //GameToken Token Address
    function setGameCoinAddress(address gameTokenAddress) public onlyOwner {
        _gameCoin=GameCoin(gameTokenAddress);
    }

    //STORE FUNCTIONALITY
    //
    //Store is where the user may pay in game tokens for equipment

    //Add an element to the store array
    function addGearToStore(Equipment.gearStats memory gear) public onlyOwner {
        require(!gearExistsInStore(gear), "Element exists in the array");
        storeGear.push(gear);
    }


    //Remove an element from the store array
    function removeGearFromStore(uint256 index) public onlyOwner {
        require(index < storeGear.length, "Index out of bounds");

        storeGear[index]= storeGear[ storeGear.length-1];
        storeGear.pop();
    }

    //Manages the purchase
    function purchase(uint256 index) external {
        require(index < storeGear.length, "Index out of bounds");
        require(_gameCoin.transferFrom(msg.sender, address(this), storeGear[index].stats[9]));

        //Mint the gear to the payer
        _equipment.mint(msg.sender, storeGear[index]);
    }

    function gearExistsInStore(Equipment.gearStats memory gear) internal view returns (bool) {
        for(uint i=0; i<storeGear.length; i++) {
            if( gear.class==storeGear[i].class &&
                gear.slot==storeGear[i].slot &&
                gear.level==storeGear[i].level &&
                gear.stats[0]==storeGear[i].stats[0] &&
                gear.stats[1]==storeGear[i].stats[1] &&
                gear.stats[2]==storeGear[i].stats[2] &&
                gear.stats[3]==storeGear[i].stats[3] &&
                gear.stats[4]==storeGear[i].stats[4] &&
                gear.stats[5]==storeGear[i].stats[5] &&
                gear.stats[6]==storeGear[i].stats[6] &&
                gear.stats[7]==storeGear[i].stats[7] &&
                gear.stats[8]==storeGear[i].stats[8] &&
                gear.stats[9]==storeGear[i].stats[9]
                )
                    return true;
        }
        return false;
    }
}