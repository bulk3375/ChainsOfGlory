//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

import "./Equipment.sol";
import "./Characters.sol";
import "./GameCoin.sol";

import {StatsAndSlots} from "./StatsAndSlots.sol";

    //***********************************
    // SETUP AFTER DEPLOY
    //***********************************
    // SET EQUIPMENT MINTER_ROLE TO THIS ADDRESS
    // SET TOKEN MINTER_ROLE TO THIS ADDRESS
    // SET QUEST_ROLE TO THIS ADDRESS IN EQU AND CHAR SC
    // SET GAMECOIN ADDRESS
    // SET CHARACTER ADDRESS
    // SET EQUIPMENT ADDRESS
    //***********************************

contract Quest is AccessControlEnumerable, Ownable {

    uint256 public combatLoops=10; //Number of loop on a combat
    uint256 randomSpread=20;    //Random variation of attacks from 0 to 100. 
                                //A spread of 30 means that random moves from 70 to 130

    //Quests to be played
    //Administrators may update, delete or modify the content
    uint256[] public allQuests;

    //maximum level a quest can be played
    //This value may be updated based on the current tier
    //For first tier we may limit to 10, the for second to 20, etc...
    //The upgrade matrix MUST be also updated in order to go further with tiers
    uint maxLevel;

    //It MUST contains the coeficients to apply to each level upgrade
    //This coeficients will be applied to duration, range, loot, drop and base points
    //TODO TODO TODO Think if it must be also applied to enemies
    //There must be the same amount of element as maxLevel
    //For example, in tier 1 maxLevel=10
    //upgradeMatrix=[0, 5, 10, 14, 18, 21, 24, 26, 28, 30]
    //Each level means the percentage of upgrade for the level regarding the basic stats    
    uint256[] upgradeMatrix;

    Equipment internal _gearNFT;    //Address of equipement NFT SC
    Characters internal _charNFT;   //Address of characters, either players and enemies, NFT SC
    GameCoin internal _gaemCoin;    //Address of characters, either players and enemies, NFT SC
    GameStats internal _gameStats;  //Address if the GameStats SC

    //Generic random counter, used to add a bit more of entropy
    uint randomNonce=0;

    //List of NFTs that can be drop
    //It is a mapping that goes from the probability (in %1000) of get the drop to the array of drops to get
    //For example, 
    // 1 per 1000 1=>array
    // 10 per 1000 10=>array
    // 100 per 1000 100=>array
    //default      1000=>array
    //TODO TODO TODO
    //We must define the probability granularity of the drops
    //that is, the keys of the mapping
    //mapping (uint256 => Equipment.gearStats[]) private dropsNFT; 

    //Set combat loop
    function setCombatLoops(uint256 newLoops) public onlyOwner {
        combatLoops=newLoops;
    }

    //Set random spread
    function setRandomSpread(uint256 spread) public onlyOwner {
        randomSpread=spread;
    }

    

    //Returns the drop array for an especific probability
    //function getDropEquipment(uint prob) public view returns (Equipment.gearStats[] memory){
    //    return dropsNFT[prob];
    //}

    //Set the array of gear for an especific probability
    //function setDropEquipment(uint prob, Equipment.gearStats[] memory gear) public onlyOwner{
    //     dropsNFT[prob]=gear;
    //}

    //To remove a drop do the following
    //Get the array for especific probability
    //Remove locally (at the react app) the element
    //Set the array for especific probability


    //Adds a single geat to the especific probability array
    //function addDropToEquipment(uint prob, Equipment.gearData memory gear) public onlyOwner{
    //     //dropsNFT[prob].push(gear);
    //}

    //Set the equipment sc afdress
    function setEquipmentAddress(address equipment) public onlyOwner {
        _gearNFT=Equipment(equipment);
    }

    //Set the charcaters sc address
    function setCharactersAddress(address characters) public onlyOwner {
        _charNFT=Characters(characters);
    }

    //Set the game coin sc address
    function setGameCoinsAddress(address gameCoin) public onlyOwner {
        _gaemCoin=GameCoin(payable(gameCoin));
    }

    //Set the equipment sc afdress
    function setGameStatsAddress(address gameStats) public onlyOwner {
        _gameStats=GameStats(gameStats);
    }

    //Set the max level of the quest
    function setMaxLevel(uint lvl, uint256[] memory matrixValues) public onlyOwner{
        require(lvl == matrixValues.length, "Exception: must provide a matrix of values of the same lenght than level");

        maxLevel=lvl;
        upgradeMatrix=matrixValues;
    }

    //Returns the upgrade matrix
    function getMatrix() public view returns (uint256[] memory){
        return upgradeMatrix;
    }

    //Add a quest and recalculate stats
    function addQuest(uint256 questIndex) public onlyOwner {
        allQuests.push(questIndex);
    }

    //Force recalculation of stats of a specific quest
    //
    //WARNING WARNING WARNING
    //
    //This function MUST be called for each quest whenever you updates 
    //an existing progress matrix of gear and or characters
    function forceRecalculateStats(uint256 idQuest) public view onlyOwner {
        require(idQuest < allQuests.length, "Index out of bounds");
    }

    //Remove an element from the store array
    function removeQuest(uint256 index) public onlyOwner {
        require(index < allQuests.length, "Index out of bounds");

        allQuests[index]= allQuests[ allQuests.length-1];
        allQuests.pop();
    }

    //Returns especific item
    function getQuestLength() public view returns(uint256) {
        return allQuests.length;
    }

    //Returns especific item
    function getQuestData(uint256 index) public view returns(uint256) {
        return allQuests[index];
    }

    function questExists(uint256 questIndex) internal view returns (bool) {
        for(uint i=0; i<allQuests.length; i++)
            if(allQuests[i]==questIndex)
                return true;
        return false;
    }

    function addCraracterStats(Characters.charData memory ca , Characters.charData memory cb) internal view returns(Characters.charData memory) {
        
        
        return ca;
    }


    struct combat {
        uint quest;
        uint level;
        Characters.charData playerFinalStats;
        uint playerHealth;
        uint questHealth;
        uint[20] hits;
    }

    function playQuest(uint idQuest, uint idPlayer, uint questLevel) public returns (combat memory) {
       
        combat memory combarData;

       

        return combarData;
    }

    //Pseudo random. I think is enough for the game
    function randMod(uint _modulus) internal returns(uint) {
        randomNonce++; 
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randomNonce))) % _modulus;
    }

    //Pseudo random. I think is enough for the game
    function randMod(uint _modulus, uint256 salt) internal returns(uint) {
        randomNonce++; 
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randomNonce, salt))) % _modulus;
    }

}