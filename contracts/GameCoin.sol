//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

import "./Equipment.sol";

    //***********************************
    // SETUP AFTER DEPLOY
    //***********************************
    //SET EQUIPMENT ADDRESS
    //SET MINTER_ROLE FOR EQUIPMENT
    //***********************************
    //
    // This SC also holds the functionality 
    // of the STORE
    //
    //***********************************

contract GameCoin is Context, AccessControlEnumerable, Ownable, ERC20 {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    //Equipment Address
    Equipment private _equipment;

    //Gear offered in the stores
    //Administrators may update, delete or modify the content
    //The store should read this array and populate the store acording to it
    Equipment.gearStats[] public storeGear;

    constructor(uint256 initialSupply) ERC20( "Chains of Gloty Token", "CGT") {
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

    //GameToken Token Address
    function setEquipmentAddress(address equipmentAddress) public onlyOwner {
        _equipment=Equipment(equipmentAddress);
    }

    //STORE FUNCTIONALITY
    //
    //Store is where the user pay in-game tokens for equipment

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

    //Returns especific item
    function getEquipmentData(uint256 index) public view returns(Equipment.gearStats memory) {
        return storeGear[index];
    }

    //Returns especific item
    function getEquipmentPrice(uint256 index) public view returns(uint256) {
        return storeGear[index].stats[9];
    }

    //Manages the purchase
    function purchase(uint256 index) public {
        require(index < storeGear.length, "Index out of bounds");        
        require(transfer(address(this), storeGear[index].stats[9]), "Transfer fail");

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