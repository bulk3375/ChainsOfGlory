//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "./rarible/royalties/contracts/LibPart.sol";
import "./rarible/royalties/contracts/LibRoyaltiesV2.sol";

contract Quest is AccessControlEnumerable, Ownable {

    struct questData {
        uint questId;	    //Index for client internal use
        uint duration;	    //Time to be completed (afected by mastery) 1/3 
        uint range;	        //Range (time to go forth and back affected by velocity) 2/3
        uint loot;		    //Loot tokens
        uint drop;		    //Basic points to get an NFT
        uint basePoints;	//Basic difficult of the mission
        uint[] enemy;	    //Enemy list    
    }


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



    //Set the max level of the quest
    function setMaxLevel(uint lvl, uint256[] memory matrixValues) public {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        require(lvl == matrixValues.length, "Exception: must provide a matrix of values of the same lenght than level");

        maxLevel=lvl;
        upgradeMatrix=matrixValues;
    }

    function getMatrix() public view returns (uint256[] memory){
        return upgradeMatrix;
    }

    function addQuest(questData memory qData) public onlyOwner {
        require(!questExists(qData), "Quest already exists");
        allQuests.push(qData);
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
                qData.basePoints==allQuests[i].basePoints &&
                qData.enemy.length == allQuests[i].enemy.length) {
                    for(uint j=0; j<allQuests[i].enemy.length; j++)
                        if(allQuests[i].enemy[j]!=qData.enemy[j])
                            return false;
                    return true;
                }
        }
        return false;
    }

}