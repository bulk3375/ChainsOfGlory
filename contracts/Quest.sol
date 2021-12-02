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

    struct questData {
        uint questId;	    //Index for client internal use
        uint duration;	    //Time to be completed (afected by mastery) 1/3 (cents on second)
        uint range;	        //Range (time to go forth and back affected by velocity) 2/3 (cents of second)
        uint loot;		    //Loot tokens
        uint drop;		    //Basic points to get an NFT
        uint health;    	//Basic health of the mission
        uint attack;    	//Basic health of the mission
        uint defense;    	//Basic health of the mission
        uint[5] enemy;	    //Enemy list  

        uint256[10] calculatedStats;    //Only in runtime: to lower the gas
    }

    uint256 public combatLoops=10; //Number of loop on a combat
    uint256 randomSpread=20;    //Random variation of attacks from 0 to 100. 
                                //A spread of 30 means that random moves from 70 to 130

    //Quests to be played
    //Administrators may update, delete or modify the content
    questData[] public allQuests;

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

    //Set the equipment sc afdress
    function setEquipmentAddress(address equipment) public onlyOwner {
        _gearNFT=Equipment(equipment);
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
    function addDropToEquipment(uint prob, Equipment.gearStats memory gear) public onlyOwner{
         //dropsNFT[prob].push(gear);
    }

    //Set the charcaters sc address
    function setCharactersAddress(address characters) public onlyOwner {
        _charNFT=Characters(characters);
    }

    //Set the game coin sc address
    function setGameCoinsAddress(address gameCoin) public onlyOwner {
        _gaemCoin=GameCoin(gameCoin);
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
    function addQuest(questData memory qData) public onlyOwner {
        require(!questExists(qData), "Quest already exists");
        require(allEnemiesExists(qData), "Enemy does not exists");
        //TODO TODO TODO
        //Test that enemies exists
        qData.calculatedStats=questEnemiesStats(qData);
        allQuests.push(qData);
    }

    //Force recalculation of stats of a specific quest
    //
    //WARNING WARNING WARNING
    //
    //This function MUST be called for each quest whenever you updates 
    //an existing progress matrix of gear and or characters
    function forceRecalculateStats(uint256 idQuest) public onlyOwner {
        require(idQuest < allQuests.length, "Index out of bounds");
        allQuests[idQuest].calculatedStats = questEnemiesStats(allQuests[idQuest]);
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
    function getQuestData(uint256 index) public view returns(questData memory) {
        return allQuests[index];
    }

    function questExists(questData memory qData) internal view returns (bool) {
        //questID is not compared
        for(uint i=0; i<allQuests.length; i++) {
            if( qData.duration==allQuests[i].duration &&
                qData.range==allQuests[i].range &&
                qData.loot==allQuests[i].loot &&
                qData.drop==allQuests[i].drop &&
                qData.health==allQuests[i].health &&
                qData.attack==allQuests[i].attack &&
                qData.defense==allQuests[i].defense &&
                qData.enemy.length == allQuests[i].enemy.length) {
                    for(uint j=0; j<allQuests[i].enemy.length; j++)
                        if(allQuests[i].enemy[j]!=qData.enemy[j])
                            return false;
                    return true;
                }
        }
        return false;
    }

    function addCraracterStats(Characters.charData memory ca , Characters.charData memory cb) internal pure returns(Characters.charData memory) {
        
        //WARNING WARNING WARNING
        //It is supposed that vitality should be already applied. A percentual stat cannot be added!!
        for(uint i=0; i< ca.stats.length; i++)
            ca.stats[i]+=cb.stats[i];
        return ca;
    }

    function questEnemiesStats(questData memory qData) public view returns (uint256[10] memory) {
        Characters.charData memory cData;

        //WARNING WARNING WARNING!! CHANGE CHANGE CHANGE!!
        //It is supposed that vitality should be already applied. A percentual stat cannot be added!!
        for(uint i=0; i < qData.enemy.length; i++)
            cData=addCraracterStats(cData, _charNFT.calculatedStats(qData.enemy[i]));
        
        return cData.stats;
    }

    struct combat {
        uint quest;
        uint level;
        Characters.charData playerFinalStats;
        questData questFinalStats;
        uint playerHealth;
        uint questHealth;
        uint[20] hits;
    }

    function playQuest(uint idQuest, uint idPlayer, uint questLevel) public returns (combat memory) {
        require(msg.sender == _charNFT.ownerOf(idPlayer), "Caller is not the owner of the player");
        require(questLevel < maxLevel, "Exception: quest level out of bounds");
        require(idQuest < allQuests.length, "Index out of bounds");
        require(_charNFT.baseStats(idPlayer).timeLock  < block.timestamp, "Exception: player is locked");

        combat memory combarData;

        Characters.charData memory playerData = _charNFT.calculatedStats(idPlayer);

        //We will use a struct to store all data to avoid the fkng
        // 'Stack too deep, try removing local variables' error 
        questData memory qData;

        //Quest total time calculation
        qData.duration=((allQuests[idQuest].duration *100) /  (1+playerData.stats[StatsAndSlots.Mastery]))/100;
        qData.duration += ((allQuests[idQuest].range *200) /  (1+playerData.stats[StatsAndSlots.Speed]))/100;

        //adds the mision health points to all the enemies Health and apply Vitality
        qData.health=allQuests[idQuest].health+allQuests[idQuest].calculatedStats[StatsAndSlots.Health];
        //WARNING WARNING WARNING
        //It is supposed that vitality should be already applied. A percentual stat cannot be added!!
        qData.health += (allQuests[idQuest].calculatedStats[StatsAndSlots.Health] * allQuests[idQuest].calculatedStats[StatsAndSlots.Vitality])/100;

        //adds the mision attack points to all the enemies Health and apply Vitality
        qData.attack=allQuests[idQuest].attack+allQuests[idQuest].calculatedStats[StatsAndSlots.Attack];

        //adds the mision attack points to all the enemies Health and apply Vitality
        qData.defense=allQuests[idQuest].defense+allQuests[idQuest].calculatedStats[StatsAndSlots.Defense];

        //Defense is like a shield, to simplify we add defense to health
        qData.health += qData.defense;
        
        //Apply questLevel
        qData.duration+=(qData.duration*upgradeMatrix[questLevel])/100;
        qData.health+=(qData.health*upgradeMatrix[questLevel])/100;
        qData.attack+=(qData.attack*upgradeMatrix[questLevel])/100;
        //missionDefense+=(missionDefense*upgradeMatrix[questLevel])/100;



        //calculates player Health and apply Vitality and faith
        //Defense is like a shield, to simplify we add defense to health
        uint256 playerHealth=playerData.stats[StatsAndSlots.Health]+playerData.stats[StatsAndSlots.Defense];
        playerHealth += (playerData.stats[StatsAndSlots.Health] * playerData.stats[StatsAndSlots.Vitality])/100;
        playerHealth += (playerData.stats[StatsAndSlots.Health] * playerData.stats[StatsAndSlots.Faith])/300;

        //calculates player Attack and apply faith
        uint256 playerAttack=playerData.stats[StatsAndSlots.Attack];
        playerAttack += (playerData.stats[StatsAndSlots.Attack] * playerData.stats[StatsAndSlots.Faith])/300;

        //calculates player defense and apply faith
        //uint256 playerDefense=playerData.stats[StatsAndSlots.Defense];
        //playerDefense += (playerData.stats[StatsAndSlots.Defense] * playerData.stats[StatsAndSlots.Faith])/300;

        uint startMissionValue=qData.attack;
        uint startPlayerValue=playerHealth;

        //Well... lets go for the quest calculation
        //I hope we didn't run out of gas... big calculations so far!
        //
        //We must start with a random seed
        //and then iterate 'combatLoops' rounds (or until one dies)
        //applying the basic formula in ten rounds
        //Player hits : missionHealth -= playerAttack * random(interval)
        //Mision hits : playerHealth -= missionAttack  * random(interval)
        //
        //NOTE: There is no enemy casualties along the combat
        //missionAttack is the same from start to end...
        //Could be interesting to allow player choose an strategy?
        //I mean: kill weakest first or kill strongest first... or kill randomly
        //May be for second version...

        for(uint i=0; i<combatLoops; i++) {
            //calculates player attack            
            uint attack=(playerAttack * (100-randMod(2*randomSpread)+randomSpread))/100;
            if(qData.health <=attack) {
                //Player wins!
                qData.health=0;
                break;
            }
            qData.health-=attack;

            attack=(qData.attack * (100-randMod(2*randomSpread)+randomSpread))/100;
            if(playerHealth <=attack) {
                //Player loses!
                playerHealth=0;
                break;
            }            
            playerHealth -= attack;
        }
        
        //calculate % completed
        uint256 completed = ((startMissionValue - qData.health) * 100) / startMissionValue;

        //TODO TODO TODO
        //Calculate token drop and send
        //Calculate NFT probability
        //Choose NFT minted (in needed) and send to player
        //
        //OPTIONALLY
        //Create a combat history and returns to front
        //

        //Set timeLock for player and all his gear
        _charNFT.setTimeLock(idPlayer, block.timestamp);
        for(uint i=0; i<_charNFT.baseStats(idPlayer).gear.length; i++)
            if(_charNFT.baseStats(idPlayer).gear[i]!=0)
                _gearNFT.setTimeLock(_charNFT.baseStats(idPlayer).gear[i], qData.duration);
        
        //Calculate tokens to mint applying quest level and completion percentage
        uint256 tokensToMint= allQuests[idQuest].loot+ ((allQuests[idQuest].loot * upgradeMatrix[questLevel]) / 100);
        tokensToMint = (tokensToMint * completed)/100;

        //Mint tokens
        _gaemCoin.mint(_charNFT.ownerOf(idPlayer), tokensToMint);

        //Recalculate drop probability applying quest level and completion percentage
        uint NFTdropProbability = allQuests[idQuest].drop + upgradeMatrix[questLevel];
        NFTdropProbability = (NFTdropProbability * completed)/100;

        if(NFTdropProbability > randMod(100, tokensToMint)) {
            //Mint NFT to player

        }

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

    function allEnemiesExists(questData memory qData) internal returns(bool) {
        for(uint i=0; i< qData.enemy.length; i++) {
            if(!_charNFT.exists(qData.enemy[i]))
                return false;
            if(_charNFT.baseStats(qData.enemy[i]).class==0)
                return false;
        }
        return true;
    }
}