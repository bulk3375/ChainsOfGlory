const Equipment = artifacts.require("Equipment"); //SC Equipment
const GameStats = artifacts.require("GameStats"); //SC GameStats
const Characters = artifacts.require("Characters"); //SC GameStats
const GameCoin = artifacts.require("GameCoin"); //SC GameStats

const BN = web3.utils.BN;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

contract("Game Coin test", (accounts) => {
    const [deployerAddress, tokenAddr1, tokenAddr2] = accounts;


    //First we will create some equipment in the GameStats SC
    it("Create some equipment and races in GameStats ", async() => {
        let gameStats = await GameStats.deployed();

        await gameStats.addEquipment([0,[[100,100,0,0,0,0,0,0]]]);
        await gameStats.addEquipment([1,[[0,0,200,200,0,0,0,0]]]);
        await gameStats.addEquipment([2,[[0,0,0,0,300,300,0,0]]]);
        await gameStats.addEquipment([3,[[0,0,0,0,0,0,400,400]]]);
        await gameStats.addRace([[[100,200,300,400,500,600,700,800]]]);
        await gameStats.addRace([[[800,700,600,500,400,300,200,100]]]);

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

        let gameCoin = await GameCoin.deployed();
        await gameCoin.setGameStatsAddress(GameStats.address);
        await gameCoin.setEquipmentAddress(Equipment.address);
        await gameCoin.setCharacterAddress(Characters.address);

        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        await equipment.grantRole(MINTER_ROLE, GameCoin.address);
        await character.grantRole(MINTER_ROLE, GameCoin.address);

        await gameCoin.mint(tokenAddr1, 1000);
        const balance = await gameCoin.balanceOf(tokenAddr1)
        assert.strictEqual(balance.toNumber(), 1000)

    });

    it("Only MINTER_ROLE can mint Token", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.mint(tokenAddr1, 1000, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must have minter role to mint", "Error is not what is expected");
        }
    });

    it("Contract Owner may assign MINTER_ROLE to other account", async () => {
        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        let token = await GameCoin.deployed();
        await token.grantRole(MINTER_ROLE, accounts[1]);
        await token.mint(tokenAddr1, 1000, {from: accounts[1]});
    });

    //Now acc 1 has 2000 tokens
    it("Owner of tokens may transfer to other account", async () => {
        let token = await GameCoin.deployed();
        await token.transfer(accounts[2], 100, {from: accounts[1]});

        let balance = await token.balanceOf(accounts[2])
        assert.strictEqual(balance.toNumber(), 100)
        balance = await token.balanceOf(accounts[1])
        assert.strictEqual(balance.toNumber(), 1900)
    });

    it("Contract Owner may add gear to the store", async () => {
        let token = await GameCoin.deployed();
        await token.addItemToStore([0,100], 1);
        await token.addItemToStore([1,20000], 1);
        await token.addItemToStore([2,300], 1);

        await token.addItemToStore([0,1000], 0);
    });

    it("Only Owner can add gear to the store", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.addItemToStore([3,100], 1, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Cannot add unexisting gear", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.addItemToStore([5,100], 1);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Gear does not exists", "Error is not what is expected");
        }
    });

    it("Contract Owner may remove gear to the store", async () => {
        let token = await GameCoin.deployed();

        let balance = await token.getItemLength(1);
        assert.strictEqual(balance.toNumber(), 3)
        await token.removeItemFromStore(0, 1);
        balance = await token.getItemLength(1);
        assert.strictEqual(balance.toNumber(), 2)
    });

    it("Only Owner can remove gear from the store", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.removeItemFromStore(0, 1, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Player may putchase an race", async () => {
        let token = await GameCoin.deployed();
        let character = await Characters.deployed();

        let {race, price}= await token.getRaceData(0)

        await token.purchaseRace("My Character", 0, {from: accounts[1], value: price}); 

        let stats = await character.baseStats(1);
        assert.equal(stats[6][0][4], 500);

        let addr = await character.ownerOf(1)
        assert.equal(addr, accounts[1])

    });

    it("Player may putchase an item, equip it and see reflected in the stats", async () => {
        let token = await GameCoin.deployed();
        let equipment = await Equipment.deployed();
        let character = await Characters.deployed();

        await token.purchaseEquipment(0, {from: accounts[1]}); 
        let balance = await equipment.balanceOf(accounts[1]);
        
        assert.strictEqual(balance.toNumber(), 1)

        balance = await token.balanceOf(accounts[1])
        assert.strictEqual(balance.toNumber(), 1600)

        let addr = await character.ownerOf(1)
        assert.equal(addr, accounts[1])

        let stats = await character.baseStats(1);
        assert.equal(stats[6][0][4], 500);

        await character.equip(1,[0,0,1,0,0,0,0,0,0,0,0], {from: tokenAddr1});
        let stats2 = await character.baseStats(1);
        assert.equal(stats2[6][0][4], 800);

    });

    it("Player can not putchase an item more expensive than his funds", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.purchaseEquipment(1, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "transfer amount exceeds balance", "Error is not what is expected");
        }
    });
})