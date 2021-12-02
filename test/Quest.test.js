const GameCoin = artifacts.require("GameCoin"); 
const Equipment = artifacts.require("Equipment");  
const Characters = artifacts.require("Characters");  
const Quest = artifacts.require("Quest"); 

const BN = web3.utils.BN;

contract("Quest test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;    

    it("Owner can add quests", async () => {
        let quest = await Quest.deployed();
 
        await quest.setEquipmentAddress(Equipment.address);
        await quest.setCharactersAddress(Characters.address);
        await quest.setGameCoinsAddress(GameCoin.address);

        await quest.addQuest([0,1000,500,50,200,150,20, 0, [0,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]]);

    });
    //After test:
    //Quest 0
    
    it("test calculated stats", async () => {
        let quest = await Quest.deployed();
 
        let token = await Characters.deployed();
        await token.mint(deployerAddress, [1,0,[100,200,300,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0]);

        await quest.addQuest([0,1000,500,50,200,150,20, 0, [1,1,1,1,1], [0,0,0,0,0,0,0,0,0,0]]);

        let cal=await quest.getQuestData(1);
        
        assert.notEqual(cal[8][0], 500);
        assert.notEqual(cal[8][1], 1000);
        assert.notEqual(cal[8][2], 1500);

    });
    //After test:
    //Quest 0, 1
    //Enemy 1

    it("Contract Owner may set level and progress matrix", async () => {
        let token = await Quest.deployed();
        await token.setMaxLevel(10, [0,5,10,14,18,21,24,26,28,30]);
    });

    it("Only contract Owner may set level and progress matrix", async () => {
        let token = await Quest.deployed();
        try{
            await token.setMaxLevel(10, [0,5,10,14,18,21,24,26,28,30], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Cannot create a quest with unexisting enemies", async () => {
        let quest = await Quest.deployed();
        try{
            await quest.addQuest([0,1000,500,50,200,150,20, 0, [1,2,0,0,0], [0,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Enemy does not exists", "Error is not what is expected");
        }
    });

    it("Cannot create a quest with players as enemies", async () => {
        let quest = await Quest.deployed();
        let token = await Characters.deployed();
        try{
            await token.mint(deployerAddress, [0,0,[5000,2000,3000,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0]);
            await quest.addQuest([0,1000,500,50,200,150,20, 0, [2,0,0,0,0], [0,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Enemy does not exists", "Error is not what is expected");
        }
    });
    //After test:
    //Quest 0, 1
    //Enemy 1
    //Player 2
})