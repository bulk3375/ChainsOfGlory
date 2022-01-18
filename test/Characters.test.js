const Equipment = artifacts.require("Equipment"); //SC Equipment
const GameStats = artifacts.require("GameStats"); //SC GameStats
const Characters = artifacts.require("Characters"); //SC GameStats

const BN = web3.utils.BN;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

contract("Character test", (accounts) => {
    const [deployerAddress, tokenAddr1, tokenAddr2] = accounts;

    //First we will create some equipment in the GameStats SC
    it("Create some equipment and races in GameStats ", async() => {
        let gameStats = await GameStats.deployed();

        await gameStats.addEquipment([0,[[100,100,0,0,0,0,0,0]]]);
        await gameStats.addEquipment([1,[[0,0,200,200,0,0,0,0]]]);
        await gameStats.addEquipment([2,[[0,0,0,0,300,300,0,0]]]);
        await gameStats.addEquipment([3,[[0,0,0,0,0,0,400,400]]]);
        await gameStats.addRace([[[100,200,300,400,500,600,700,800]]]);

    /**********************************************
     **********************************************
                   SETUP CONTRACT
    **********************************************                    
    **********************************************/

        let character = await Characters.deployed();
        await character.setGameStatsAddress(GameStats.address);
        await character.setEquipmentAddress(Equipment.address);
        await character.setMaxLevel(10, [0,1,2,3,4,5,6,7,8,9]);

        let equipment = await Equipment.deployed();
        await equipment.setGameStatsAddress(GameStats.address);
        await equipment.setCharactersAddress(Characters.address);
        await equipment.setMaxLevel(10, [0,1,2,3,4,5,6,7,8,9]);

        //Mint some gear
        await equipment.mint(tokenAddr1, [0,0,0,0,0,[[0,0,0,0,0,0,0,0]]]); //id 1
        await equipment.mint(tokenAddr1, [1,0,0,0,0,[[0,0,0,0,0,0,0,0]]]); //id 2
        await equipment.mint(tokenAddr1, [2,0,0,0,0,[[0,0,0,0,0,0,0,0]]]); //id 3
        await equipment.mint(tokenAddr1, [3,0,0,0,0,[[0,0,0,0,0,0,0,0]]]); //id 4
    });

    it("Test that NFT 0 exists", async() => {
        let character = await Characters.deployed();
        
        let gear = await character.baseStats(0);
        assert.equal(gear[0], 0);
        assert.equal(gear[1], 0);
        assert.equal(gear[2], 0);

    });

    it("is possible to mint a character NFT", async() => {
        let character = await Characters.deployed();
        
        await character.mint(tokenAddr1, "My Character", 0);

        let stats = await character.baseStats(1);
        assert.equal(stats[6][0][0], 100);
    });

    it("Only MINTER_ROLE can mint", async () => {
        let character = await Characters.deployed();
        try{
            await character.mint(tokenAddr1, "Another Character", 0, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: must have minter role to mint", "Error is not what is expected");
        }
    });

    it("Cannot mint unexisting race", async () => {
        let character = await Characters.deployed();
        try{
            await character.mint(tokenAddr1, "Another Character", 10);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: race index out of bounds", "Error is not what is expected");
        }
    });

    it("update matrix is working", async() => {
        let character = await Characters.deployed();
        
        await character.updateLevel(1);
        let stats = await character.baseStats(1);
        assert.equal(stats[6][0][0], 101);

        await character.updateLevel(1);
        let stats2 = await character.baseStats(1);
        assert.equal(stats2[6][0][0], 102);
    });

    it("cannot go beyond max level", async() => {
        let character = await Characters.deployed();
        
        await character.updateLevel(1);
        await character.updateLevel(1);
        await character.updateLevel(1);
        await character.updateLevel(1);
        await character.updateLevel(1);
        await character.updateLevel(1);
        await character.updateLevel(1);
        try{
            await character.updateLevel(1);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: player is already at max level", "Error is not what is expected");
        }

    });

    it("Equip some gear and test stats", async() => {
        let character = await Characters.deployed();
        
        await character.equip(1,[1,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        let stats = await character.baseStats(1);
        assert.equal(stats[6][0][0], 209);

        await character.equip(1,[1,2,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        let stats2 = await character.baseStats(1);        
        assert.equal(stats2[6][0][3], 636);

        await character.equip(1,[1,2,3,4,0,0,0,0,0,0,0], {from: tokenAddr1});
        let stats3 = await character.baseStats(1);        
        assert.equal(stats3[6][0][7], 1272);
        
    });

    it("Does not allow equip in wrong slot", async() => {
        let character = await Characters.deployed();        
        
        try{
            await character.equip(1,[2,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: some gear is not valid (wrong: slot, timelock, owner or exists)", "Error is not what is expected");
        }

    });

    it("Does not allow equip an item not owned", async() => {
        let character = await Characters.deployed();    
        let equipment = await Equipment.deployed();

        await character.equip(1,[0,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        await equipment.transferFrom(tokenAddr1, tokenAddr2, 1, {from: tokenAddr1});        
        
        try{
            await character.equip(1,[1,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: some gear is not valid (wrong: slot, timelock, owner or exists)", "Error is not what is expected");
        }

    });

    it("Does not allow equip an item that does not exists", async() => {        
        let character = await Characters.deployed();        
        let equipment = await Equipment.deployed();
        
        await equipment.transferFrom(tokenAddr2, tokenAddr1, 1, {from: tokenAddr2});    

        try{
            await character.equip(1,[7,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: some gear is not valid (wrong: slot, timelock, owner or exists)", "Error is not what is expected");
        }

    });

    it("Does not allow equip an item already equiped in ither character", async() => {        
        let character = await Characters.deployed(); 
        
        await character.mint(tokenAddr1, "My Other Character", 0);
        await character.equip(2,[1,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        
        try{
            await character.equip(1,[1,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Exception: some gear is already equiped in other player", "Error is not what is expected");
        }

    });

    it("Change level of equipment and test that triggers Character recalculate stats", async() => {
        let character = await Characters.deployed();
        let equipment = await Equipment.deployed();
        
        await character.equip(2,[0,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        await character.equip(1,[1,0,0,0,0,0,0,0,0,0,0], {from: tokenAddr1});

        let stats = await character.baseStats(1);
        assert.equal(stats[6][0][0], 209);

        await equipment.updateLevel(1);

        let stats2= await character.baseStats(1);
        assert.equal(stats2[6][0][0], 210);
        assert.equal(stats2[6][0][1], 319);
        
    });
})