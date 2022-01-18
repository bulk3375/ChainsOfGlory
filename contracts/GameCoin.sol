//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "./Characters.sol";
import "./Equipment.sol";
import "./GameStats.sol";

contract GameCoin is AccessControlEnumerable, Ownable, ERC20 {

    //Equipment SC
    Equipment private _equipment;
    //Equipment SC
    Characters private _character;
    //Game Stats SC
    GameStats private _gameStats;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    //Gear offered in the stores
    //Administrators may update, delete or modify the content
    //The store should read this array and populate the store acording to it
    //Elements are indexes of the equipment array of GameStats
    struct StoreItem {
        uint16 itemIndex;  //Index of the item, either equipment or race
        uint256 price;      //Price in tokens or matic
    }
    StoreItem[] public storeGear;   //Equipment to sell
    StoreItem[] public storeRaces;  //Races to sell

    constructor(uint256 initialSupply) ERC20( "Chains of Glory Token", "CGT") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());

        _mint(msg.sender, initialSupply);
    }

    function decimals() public pure override returns (uint8) {
		return 0;
	}

    function mint(address to, uint256 amount) public virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        _mint(to, amount);
    }

    function burn(uint256 amount) public virtual {
        require(hasRole(BURNER_ROLE, _msgSender()), "Exception: must have burner role to burn");
        _burn(_msgSender(), amount);
    }

    function burn(address from, uint256 amount) public virtual {
        require(hasRole(BURNER_ROLE, _msgSender()), "Exception: must have burner role to burn");
        _burn(from, amount);
    }

    receive() external payable {}

    function withdraw(uint amount) external onlyOwner {
        payable(msg.sender).transfer(amount);
    }

    //GameToken Token Address
    function setCharacterAddress(address characterAddress) public onlyOwner {
        _character=Characters(characterAddress);
    }
    function setEquipmentAddress(address equipmentAddress) public onlyOwner {
        _equipment=Equipment(equipmentAddress);
    }

    function setGameStatsAddress(address gameStatsAddress) public onlyOwner {
        _gameStats=GameStats(gameStatsAddress);
    }

    //STORE FUNCTIONALITY
    //
    //Store is where the user pay in-game tokens for equipment

    //Add an element to the store array
    function addItemToStore(StoreItem memory item, uint8 class) public onlyOwner {
        require(!itemExistsInStore(item.itemIndex, class), "Element exists in the array"); //Index of the item
        require(class==0 || item.itemIndex<_gameStats.numEquipment(), "Gear does not exists");  //Index of the item
        require(class==1 || item.itemIndex<_gameStats.numRaces(), "Race does not exists");
        if(class==0)
            storeRaces.push(item);
        else
            storeGear.push(item);
    }

    //Remove an element from the store array
    function removeItemFromStore(uint256 index, uint8 class) public onlyOwner {
        require(class==0 || index < storeGear.length, "Index out of equipment bounds");
        require(class==1 || index < storeRaces.length, "Index out of races bounds");

        if(class==0) {
            storeRaces[index]= storeRaces[ storeRaces.length-1];
            storeRaces.pop();
        }            
        else {            
            storeGear[index]= storeGear[ storeGear.length-1];
            storeGear.pop();
        }            
    }

    //Returns especific item
    function getItemLength(uint8 class) public view returns(uint256) {
        if(class==0)
            return storeRaces.length;

        return storeGear.length;
    }

    //Returns especific item
    function getEquipmentData(uint256 index) public view returns(GameStats.EquipmentItem memory equipment, uint256 price) {
        require(index < storeGear.length, "Index out of equipment bounds");
        return (_gameStats.equipmentAt(storeGear[index].itemIndex), storeGear[index].price);    //Index of the item
    }

    function getRaceData(uint256 index) public view returns(GameStats.RaceItem memory race, uint256 price) {
        require(index < storeRaces.length, "Index out of races bounds");
        return (_gameStats.raceAt(storeRaces[index].itemIndex), storeRaces[index].price);    //Index of the item
    }

    //Manages the purchase
    function purchaseEquipment(uint256 index) public {
        require(index < storeGear.length, "Index out of equipment bounds");        
        require(transfer(address(this), storeGear[index].price), "Transfer fail");

        Equipment.gearData memory gearData;
        gearData.class=storeGear[index].itemIndex;  //Index of the item
        gearData.level=0;

        //Mint the gear to the payer
        _equipment.mint(msg.sender, gearData);
    }

    function purchaseRace(string memory charName, uint256 index) external payable {
        require(index < storeRaces.length, "Index out of races bounds");
        require(msg.value>=storeRaces[index].price, "Not enough funds sent!");

        //Mint the race to the payer
        _character.mint(msg.sender, charName, storeRaces[index].itemIndex);
    }

    function itemExistsInStore(uint256 item, uint8 class) internal view returns (bool) {
        if(class==0) {
            for(uint256 i=0; i<storeRaces.length; i++)
                if(storeRaces[i].itemIndex==item)
                    return true;
            return false;
        }

        for(uint256 i=0; i<storeGear.length; i++)
            if(storeGear[i].itemIndex==item)    //Index of the item
                return true;
        return false;
    }

}