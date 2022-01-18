const Equipment = artifacts.require("Equipment"); //SC Equipment
const GameStats = artifacts.require("GameStats"); //SC GameStats
const Characters = artifacts.require("Characters"); //SC GameStats

const BN = web3.utils.BN;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

/*
struct gearData {
    uint256  class;	        //Type of NFT
    uint16  level;     	    //By default is 0. Evolvable NFTs may upgrade this level
    uint256 timeLock;       //Timestamp until the player is locked (mission time)

    uint256 equipedIn;      //Character index where the gear is equipped

    uint256     lastCache;  //Last timestamp the calcucaltedStats has been calculated
    GameStats.BaseStats   cachedStats;
    //Change gear and/or update level will trigger a cache reload
    //if globalCacheTimestamp is greater than lastCache it will also trigger a reload
}
*/

contract("Equipment test", (accounts) => {
    const [deployerAddress, tokenAddr1, tokenAddr2] = accounts;

    //First we will create some equipment in the GameStats SC
    it("Create some equipment and races in GameStats and one charater to test", async() => {
        let gameStats = await GameStats.deployed();
    
        //await sc.addEquipment([0,[[0,0,0,0,0,0,0,0]]]);
        await gameStats.addEquipment([0,[[100,100,0,0,0,0,0,0]]]);
        await gameStats.addEquipment([1,[[0,0,2,2,0,0,0,0]]]);
        await gameStats.addEquipment([2,[[0,0,0,0,3,3,0,0]]]);
        await gameStats.addEquipment([3,[[0,0,0,0,0,0,4,4]]]);

        let gear0 = await gameStats.equipmentAt(0);
        assert.equal(gear0[0], 0);

        let gear1 = await gameStats.equipmentAt(1);
        assert.equal(gear1[0], 1);

        let gear2 = await gameStats.equipmentAt(2);
        assert.equal(gear2[0], 2);

        let gear3 = await gameStats.equipmentAt(3);
        assert.equal(gear3[0], 3);

        await gameStats.addRace([[[100,200,300,400,500,600,700,800]]]);

        let character = await Characters.deployed();
        //Set GameStats address and initialize it
        await character.setGameStatsAddress(GameStats.address);
        await character.setEquipmentAddress(Equipment.address);
        await character.setMaxLevel(10, [0,1,2,3,4,5,6,7,8,9]);
        await character.mint(tokenAddr1, "My Character", 0);

    /**********************************************
     **********************************************
                   SETUP CONTRACT
    **********************************************                    
    **********************************************/

        let token = await Equipment.deployed();

        //Set GameStats address
        await token.setGameStatsAddress(GameStats.address);
        //Set Characters address
        await token.setCharactersAddress(Characters.address);

        //Initializate the level matrix
        await token.setMaxLevel(10, [0,1,2,3,4,5,6,7,8,9]);

    });

    it("Test that NFT 0 exists", async() => {
        let token = await Equipment.deployed();
        
        let gear = await token.getGearData(0);
        assert.equal(gear[0], 0);
        assert.equal(gear[1], 0);
        assert.equal(gear[2], 0);
        assert.equal(gear[3], 0);
        assert.equal(gear[4], 0);

    });

    it("is possible to mint an equipment NFT", async() => {
        let token = await Equipment.deployed();
        
        // Instantiate a class 0 gear [100,100,0,0,0,0,0,0];
        await token.mint(tokenAddr1, [0,0,0,0,0,[[0,0,0,0,0,0,0,0]]]);

        let stats = await token.getCachedStats(1);
        assert.equal(stats[0][0], 100);
    });

    it("Only MINTER_ROLE can mint", async () => {
        let token = await Equipment.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,0,0,0,[[0,0,0,0,0,0,0,0]]], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: must have minter role to mint", "Error is not what is expected");
        }
    });

    it("Cannot mint unexisting gear", async () => {
        let token = await Equipment.deployed();
        try{
            await token.mint(tokenAddr1, [10,0,0,0,0,[[0,0,0,0,0,0,0,0]]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: equipment index out of bounds", "Error is not what is expected");
        }
    });

    it("update matrix is working", async() => {
        let token = await Equipment.deployed();
        
        await token.updateLevel(1);
        let stats1 = await token.getCachedStats(1);
        assert.equal(stats1[0][0], 101);

        await token.updateLevel(1);
        let stats2 = await token.getCachedStats(1);
        assert.equal(stats2[0][0], 102);
    });

    it("cannot go beyond max level", async() => {
        let token = await Equipment.deployed();
        
        await token.updateLevel(1);
        await token.updateLevel(1);
        await token.updateLevel(1);
        await token.updateLevel(1);
        await token.updateLevel(1);
        await token.updateLevel(1);
        await token.updateLevel(1);
        try{
            await token.updateLevel(1);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: equipment is already at max level", "Error is not what is expected");
        }

    });

    it("can transer an owned item", async() => {
        let token = await Equipment.deployed();
        
        await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: tokenAddr1});
        await token.transferFrom(tokenAddr2, tokenAddr1, 1, {from: tokenAddr2});
    });

    it("cannot transer an item not owned", async() => {
        let token = await Equipment.deployed();
        
        try{
            await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: tokenAddr2});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "ERC721: transfer caller is not owner nor approved", "Error is not what is expected");
        }
    });

    it("Cannot transfer an equipped item", async() => {
        let character = await Characters.deployed();

        await character.equip(1,[1,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        let token = await Equipment.deployed();
        try{
            await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: tokenAddr1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: cannot transfer an equipped item", "Error is not what is expected");
        }

    });

    it("cannot transer a timelocked item", async() => {
        let token = await Equipment.deployed();
        await token.setTimeLock(1, 5);
        
        try{
            await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: tokenAddr1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: equipment is locked", "Error is not what is expected");
        }

    });

    it("Once timelock passes, the item can be transferred", async() => {
        let token = await Equipment.deployed();
        
        await sleep(6000);  

        //Unequip
        let character = await Characters.deployed();
        await character.equip(1,[0,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});

        await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: tokenAddr1});
        await token.transferFrom(tokenAddr2, tokenAddr1, 1, {from: tokenAddr2});

    });
})