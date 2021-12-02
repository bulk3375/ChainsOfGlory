const GameCoin = artifacts.require("GameCoin"); 
const Equipment = artifacts.require("Equipment");  
const Characters = artifacts.require("Characters");  
const Quest = artifacts.require("Quest"); 

const BN = web3.utils.BN;

contract("Quest test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;    

    it("Owner can add quests", async () => {
        let quest = await Quest.deployed();
 
        /*
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
        */
        await quest.addQuest([0,1000,500,50,200,150,20, 0, [0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]]);
    });
})