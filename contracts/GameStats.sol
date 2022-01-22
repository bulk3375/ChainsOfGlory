//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

/*
This contracts contains all the relevan data of the Chains of Glory game
We may consider that it is acting as a database for the game.
*/
contract GameStats is AccessControlEnumerable, Ownable {

    //Roles of monter and burner
    bytes32 public constant MASTER_ROLE = keccak256("MASTER_ROLE");

    //Stats shared by Characters and Equipment
    struct BaseStats {
        uint16[8] values;
        // 0 - Health   Base life of character        
        // 1 - Attack   Hit points
        // 2 - Defense  Reduce each enemy hit in 'defense' points
        // 3 - Dodge    Probability of enemy failing attack
        // 4 - Mastery  % Reduce mission time (50 reduces to half)
        // 5 - Speed    % Reduce travel time (50 reduces to half)
        // 6 - Luck     % drop chance
        // 7 - Faith    Increases health, attack and deffense
    }

    struct RaceItem {
        BaseStats   stats;  //Base stats of the item
    }

    struct EquipmentItem {
        uint8       slot;   // 0-Head 1-Neck 2-Chest 3-Belt 4-Legs 5-Feet 6-Arms 
                            // 7-RHand (weapon) 8-LHand(complement) 9-Finger 10-Mount
                            // 100 - Wildcard
        BaseStats   stats;  //Base stats of the item
    }

    struct EnemyStats {
        uint16[3]   values;
        // 0 - Health   Base life of enemies
        // 1 - Attack   Hit points
        // 2 - Defense  Reduce each player hit in 'defense' points
    }

    struct QuestStats {
        uint256     enemy;  //Enemy of the quest (0 means no enemy)
        uint16[4]   values;
        // 0 - Distance  Time to complete the trip to the quest place
        // 1 - Time  Standard time to complete the mission
        // 2 - Luck => drop probability
        // 3 - Reward
    }

    //Database with all races, equipment types, enemies and quests
    RaceItem[] races;
    EquipmentItem[] equipment;
    EnemyStats[] enemies;
    QuestStats[] quests;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MASTER_ROLE, _msgSender());
    }

    function addRace(RaceItem memory race) public onlyRole(MASTER_ROLE) {
        races.push(race);
    }

    function addEquipment(EquipmentItem memory item) public onlyRole(MASTER_ROLE) {
        equipment.push(item);
    }

    function addEnemy(EnemyStats memory enemmy) public onlyRole(MASTER_ROLE) {
        enemies.push(enemmy);
    }
    
    function addQuest(QuestStats memory quest) public onlyRole(MASTER_ROLE) {  
        require(quest.enemy<enemies.length, "Exception: index out of range");      
        quests.push(quest);
    }

    function replaceRace(RaceItem memory race, uint pos) public onlyRole(MASTER_ROLE) {
        require(pos<races.length, "Exception: index out of range");
        races[pos]= race;
    }
    
    function replaceEquipment(EquipmentItem memory item, uint pos) public onlyRole(MASTER_ROLE) {
        require(pos<equipment.length, "Exception: index out of range");
        equipment[pos]= item;
    }

    function replaceEnemy(EnemyStats memory enemy, uint pos) public onlyRole(MASTER_ROLE) {
        require(pos<enemies.length, "Exception: index out of range");
        enemies[pos]= enemy;
    }
    
    function replaceQuest(QuestStats memory quest, uint pos) public onlyRole(MASTER_ROLE) {
        require(pos<quests.length, "Exception: index out of range");
        quests[pos]= quest;
    }

    function numRaces() public view returns (uint256) {
        return races.length;
    }
    
    function numEquipment() public view returns (uint256) {
        return equipment.length;
    }

    function numEnemies() public view returns (uint256) {
        return enemies.length;
    }

    function numQuests() public view returns (uint256) {
        return quests.length;
    }

    function raceAt(uint256 pos) public view returns (RaceItem memory race) {
        require(pos<races.length, "Exception: index out of range");
        return races[pos];
    }

    function equipmentAt(uint256 pos) public view returns (EquipmentItem memory item) {
        require(pos<equipment.length, "Exception: index out of range");
        return equipment[pos];
    }

    function enemyAt(uint256 pos) public view returns (EnemyStats memory enemy) {
        require(pos<enemies.length, "Exception: index out of range");
        return enemies[pos];
    }

    function questAt(uint256 pos) public view returns (QuestStats memory quest) {
        require(pos<quests.length, "Exception: index out of range");
        return quests[pos];
    }

}