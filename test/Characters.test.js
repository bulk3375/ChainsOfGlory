const Characters = artifacts.require("Characters"); //SC characters 
const Equipment = artifacts.require("Equipment");   //SC equipment

const BN = web3.utils.BN;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

async function addressHasPlayer(address, nplayer) {
    let token = await Characters.deployed();
    let players = await token.getCharacters(address);
    for (let step = 0; step < players.length; step++)
        if(players[step].toNumber() == nplayer)
            return true;
    return false;
}

//For each function we will test all the requires both in happy and unhappy path
contract("Character test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;


    //Mint player - Happy path without gear
    it("is possible to mint a character", async() => {
        let token = await Characters.deployed();
        //Set the gear adress into Character SC    
        await token.setEquipmentAddress(Equipment.address);

        await token.mint(tokenAddr1, [0,0,[0,1000,800,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0]);

        assert.ok(await addressHasPlayer(tokenAddr1, 1));
    });
    //After test:
    //tokenAddr1 owns player NFT 1 (remember NFT 0 is created on SC deployment)



    //Mint player - Happy path with gear
    it("Can mint using gear that own", async () => {
        let gear = await Equipment.deployed();
        //Mint a gear for slot 0 (head)
        await gear.mint(tokenAddr1, [0,0,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=0 level=0
        
        //Assign gear to address1 NFT 1
        //Remember that equipment 1 is created on SC deployment and represetn no item at all!!
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [0,0,[1,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0],0]);

        assert.ok(await addressHasPlayer(tokenAddr1, 2));
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Mint player - must have minter role to mint
    //require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
    it("Only MINTER_ROLE can mint NFT", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must have minter role to mint", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Mint player - assign mint to account and then can mint
    it("Contract Owner may assign MINTER_ROLE to other account", async () => {
        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        let token = await Characters.deployed();
        await token.grantRole(MINTER_ROLE, accounts[1]);
        await token.mint(tokenAddr1, [0,0,[2,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0], {from: accounts[1]});
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Mint player - cannot mint using gear thet does not exists
    it("Cannot mint using unexisting gear", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,5,0,0,0,0,0,0,0,0,0],0]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not valid", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Mint player - player does not own all gear in mint
    it("Cannot mint using gear that do not own", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr2, [0,0,[0,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0],0]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not valid", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Mint player - cannot mint using gear in incorrect slot
    it("Cannot mint using gear on wong slot", async () => {
        let token = await Characters.deployed();
        try{
            //Cannot equip Gear 1 on slot 1 because is for slot 0
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,1,0,0,0,0,0,0,0,0,0],0]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not valid", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Mint player - some gear is already equiped in other player
    it("Cannot mint using gear already equiped", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[1,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0],0]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is already equiped in other player", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)



    //Test rarible royalties
    it("Test Rarible royalties", async() => {
        let token = await Characters.deployed();
        await token.setRoyalties(0, deployerAddress, 1000);
        let royalties = await token.getRaribleV2Royalties(0);
        assert.equal(royalties[0].value, '1000');
        assert.equal(royalties[0].account, deployerAddress);
    });

    //Test Opensea royalties
    it("Test ERC2981 Royalties (OpenSea)", async() => {
        let token = await Characters.deployed();
        await token.setRoyalties(0, deployerAddress, 1000);
        let royalties = await token.royaltyInfo(0, 100000);
        assert.equal(royalties.royaltyAmount.toString(), '10000');
        assert.equal(royalties.receiver, deployerAddress);
    });


    //Test that get characters works
    it("Test that getCharacters works", async () => {
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [0,0,[3,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0]);
        await token.mint(tokenAddr2, [0,0,[4,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0],0]);
        let characters = await token.getCharacters(tokenAddr1);        
        assert.equal(characters.length, 4);
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //TRansfer player equiped fails
    it("Cannot transfer a player wearing any equipment", async () => {
        let token = await Characters.deployed();
        try{
            await token.transferFrom(tokenAddr1, tokenAddr2, 2, {from: accounts[1]});      
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "cannot transfer a player wearing any equipment", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Unequip and transfer
    it("test that unequipAndTransferFrom really unequip and transfer", async () => {

        let token = await Characters.deployed();
        let gear = await Equipment.deployed();

        //before transfer player 1 has gear 1 equiped at slot 0
        let characterStats = await token.baseStats(2);
        assert.equal(characterStats[3][0], 1); //Pos 3 is gear, pos 0 of gear is head

        
        //Transfer PJ 1 fro add1 to addr2
        await token.unequipAndTransferFrom(tokenAddr1, tokenAddr2, 2, {from: accounts[1]});      
        let characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 3);
        assert.notEqual(characters1[1].toNumber(), 2);
        let characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 2);
        assert.equal(characters2[1].toNumber(), 2);
        
        //After equipment still has 1 gear
        equipment = await gear.getEquipment(tokenAddr1);
        assert.equal(equipment.length, 1);
        
        //Leave balances as it was and test again balances
        await token.transferFrom(tokenAddr2, tokenAddr1, 2, {from: accounts[2]});      
        characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 4);
        characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 1);

        //Equip again gear 1
        await token.equip(2, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Transfer player and test reverse mapping _tokensByOwner working
    it("NFT Owner can transfer and _tokensByOwner balances are updated", async () => {
        let token = await Characters.deployed();
        //Transfer PJ 1 fro add1 to addr2
        await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: accounts[1]});      
        let characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 3);
        assert.notEqual(characters1[0].toNumber(), 1);
        let characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 2);
        assert.equal(characters2[1].toNumber(), 1);        
        
        //Leave balances as it was and test again balances
        await token.transferFrom(tokenAddr2, tokenAddr1, 1, {from: accounts[2]});      
        characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 4);
        characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 1);
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Only Owner of an NFT can transfer it
    it("Only Owner of an NFT can transfer it", async () => {
        let token = await Characters.deployed();
        try{
            await token.transferFrom(tokenAddr1, tokenAddr2, 0, {from: accounts[2]});      
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "transfer caller is not owner nor approved", "Error is not what is expected");
        }
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Test that singleStats works
    it("Test that singleStats works", async () => {
        let token = await Characters.deployed();
 
        //Get stats of NFT 0
        let stats = await token.singleStats(1);
        assert.equal(stats[2][0], 0);
        assert.equal(stats[2][1], 1000);
        
        //Get stats of NFT 1
        stats = await token.singleStats(2);
        assert.equal(stats[2][0], 1);
        assert.equal(stats[2][1], 3);
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Test that calculatedStats works
    it("Test that calculatedStats works", async () => {
        let token = await Characters.deployed();
        
        //Get stats of NFT 1
        let stats = await token.singleStats(2);                
        assert.equal(stats[2][0], 1);
        assert.equal(stats[2][1], 3);

        //PJ Stats      [1,3,2,1,8,7,6,9,2,3]
        //Gear Stats    [1,2,3,4,5,6,7,8,9,10]
        //Get stats of NFT 1
        stats = await token.calculatedStats(2);
        assert.equal(stats[2][0], 2); //1+1
        assert.equal(stats[2][1], 5); //3+2
        assert.equal(stats[2][9], 13); //3+10
    });
    //After test:
    //tokenAddr1 owns player NFT 1, 2, 3, 4 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Mint an enemy, transfer to addr 1 and try to equip it
    it("Test that cannot equip an enemy", async () => {
        let token = await Characters.deployed();
        try{
            let gear = await Equipment.deployed();

            //Creates some gear on SC owner to equipo the enemy
            await gear.mint(deployerAddress, [0,0,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=1 level=0 id 2
            await gear.mint(deployerAddress, [0,1,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=2 level=0 id 3

            //enemies may be only equiped at mint time (minted to SC owner) PJ=6
            await token.mint(deployerAddress, [1,0,[6,3,2,1,8,7,6,9,2,3],[2,3,0,0,0,0,0,0,0,0,0],0]); //Mint enemy NFT id=6

            //Leave balances as it was and test again balances
            await token.transferFrom(deployerAddress, tokenAddr1, 6); 

            //Try to equip enemy
            await token.equip(6, [1,2,3,0,0,0,0,0,0,0,0], {from: accounts[1]});

            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "Cannot equip an enemy!", "Error is not what is expected");
        }                
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //cannot equip a player that I do not own
    it("Test that cannot equip a player that I do not own", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(1, [0,0,0,0,0,0,0,0,0,0,0]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must be owner of the player to equip", "Error is not what is expected");
        }
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //cannot equip gear that does not exists
    it("Test that cannot equip gear that does not exists", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(1, [0,5,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not valid", "Error is not what is expected");
        }                
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Test that timelocks works in players
    //require(values[player].timeLock  < block.timestamp, "Exception: player is locked");
    it("Test that cannot equip gear in a timelocked player", async () => {
        let token = await Characters.deployed();
        await token.setTimeLock(1, 5);
        try{
            await token.equip(1, [0,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "player is locked", "Error is not what is expected");
        }                
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Test that timelocks works in players
    //require(values[player].timeLock  < block.timestamp, "Exception: player is locked");
    it("Test that timelock finish and player may be equiped then", async () => {
        let token = await Characters.deployed();
        
        await sleep(6000);        
        await token.equip(2, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5


    
    //Test that timelocks works in gear
    //require(!gearLocked(gear), "Exception: some gear is locked");
    it("Test that cannot equip timelocked gear", async () => {
        let token = await Characters.deployed();
        let gear = await Equipment.deployed();
        await gear.setTimeLock(1, 5);
        try{
            await token.equip(2, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is locked", "Error is not what is expected");
        }                
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Test that timelocks works in gear
    //require(values[player].timeLock  < block.timestamp, "Exception: player is locked");
    it("Test that timelock finish and gear may be equiped then", async () => {
        let token = await Characters.deployed();
        
        await sleep(6000);        
        await token.equip(2, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
    });
   //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5

    

    //Equip player - player does not own all gear to equip
    it("Cannot equip using gear that do not own", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(5, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[2]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not valid", "Error is not what is expected");
        }
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //cannot equip gear in wrong slot
    it("Test that cannot equip gear in the wrong slot", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(1, [0,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            await token.equip(1, [0,1,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not valid", "Error is not what is expected");
        }                
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5

    

    //cannot equip gear already equiped in other player
    //require(!alreadyEquipedInOtherPlayer(player, gear), "Exception: some gear is already equiped in other player in equip");
    it("Test that cannot equip gear already equiped", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(1, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            await token.equip(2, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is already equiped in other player in equip", "Error is not what is expected");
        }                
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Create several gear, equip and unequip gear and calculate stats
    it("Test fully gear creation, equipment and stats", async () => {
        
        let gear = await Equipment.deployed();

        let equipment = await gear.getEquipment(tokenAddr1);

        //Mint a gear for slot 1, 2, 3, 4, 5, 6, 7, 8, 9 and 10. Remember that there is already 1 for slot 0
        await gear.mint(tokenAddr1, [0,1,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=1 level=0 id=4
        await gear.mint(tokenAddr1, [0,2,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=2 level=0 id=5
        await gear.mint(tokenAddr1, [0,3,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=3 level=0 id=6
        await gear.mint(tokenAddr1, [0,4,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=4 level=0 id=7
        await gear.mint(tokenAddr1, [0,5,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=5 level=0 id=8
        await gear.mint(tokenAddr1, [0,6,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=6 level=0 id=9
        await gear.mint(tokenAddr1, [0,7,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=7 level=0 id=10
        await gear.mint(tokenAddr1, [0,8,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=8 level=0 id=11
        await gear.mint(tokenAddr1, [0,9,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=9 level= id=12
        await gear.mint(tokenAddr1, [0,10,0,[1,2,3,4,5,6,7,8,9,10],0]); //class=0 slot=10 level=0 id=13

        equipment = await gear.getEquipment(tokenAddr1);

        //So far there are 11 gear NFT, named from 1 to 11 (remember gearNFT 0 is created by SC)
        //slots 0 to 10, al owned by addr1


        let token = await Characters.deployed();
        //Equip all gear in PJ 1 (except the gear 1 that is already equiped in PJ 1)
        await token.equip(1, [0,4,5,6,7,8,9,10,11,12,13], {from: accounts[1]});
        
        //unequip all
        await token.equip(1, [0,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});

        //Full equip PJ 2
        await token.equip(2, [1,4,5,6,7,8,9,10,11,12,13], {from: accounts[1]});
        
        //Get stats of NFT 1
        let stats = await token.singleStats(2);                
        assert.equal(stats[2][0], 1);
        assert.equal(stats[2][1], 3);

        //PJ Stats          [1,3,2,1,8,7,6,9,2,3]
        //Gear Stats *11    [1,2,3,4,5,6,7,8,9,10]
        //Get stats of NFT 1
        stats = await token.calculatedStats(2);
        assert.equal(stats[2][0], 12); //1+(1*11)
        assert.equal(stats[2][1], 25); //3+(2*11)
        assert.equal(stats[2][9], 113); //3+(10*11)
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1,4,5,6,7,8,9,10,11,12,13 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5



    //Create wildcard gear and equip in different slots
    it("Test wildcard gear creation and equipment in any slots", async () => {
        
        let gear = await Equipment.deployed();
        //Mint a gear for slot 1, 2, 3, 4, 5, 6, 7, 8, 9 and 10. Remember that there is already 1 for slot 0
        await gear.mint(tokenAddr1, [0,100,0,[10,10,10,10,10,0,0,0,0,0],0]); //class=0 slot=100 (wildcard) level=0 id=14
        await gear.mint(tokenAddr1, [0,100,0,[0,0,0,0,0,20,20,20,20,20],0]); //class=0 slot=100 (wildcard) level=0 id=15

        
        let token = await Characters.deployed();
        
        //equip only wildcards in slots
        await token.equip(2, [0,0,0,0,0,14,0,0,0,15,0], {from: accounts[1]});
        
        //Get stats of NFT 1
        let stats = await token.singleStats(2);                
        assert.equal(stats[2][0], 1);
        assert.equal(stats[2][1], 3);

        //PJ Stats          [1,3,2,1,8,7,6,9,2,3]
        //wildcard 12       [10,10,10,10,10,0,0,0,0,0]
        //wildcard 13       [0,0,0,0,0,20,20,20,20,20]
        //Get stats of NFT 1
        stats = await token.calculatedStats(2);
        assert.equal(stats[2][0], 11); //1+10
        assert.equal(stats[2][1], 13); //3+10
        assert.equal(stats[2][9], 23); //3+20

        //Equip all gear in PJ 0 (except the wildcards). All gear should be free now
        await token.equip(1, [1,4,5,6,7,8,9,10,11,12,13], {from: accounts[1]});
    });
    //After test:
    //deployerAddress owns gear NFT 2, 3
    //tokenAddr1 owns player NFT 1, 2, 3, 4, 6 (remember NFT 0 is created on SC deployment)
    //tokenAddr1 owns gear NFT 1,4,5,6,7,8,9,10,11,12,13 equipend id Player 2 (remember NFT 0 is created on SC deployment)
    //tokenAddr2 owns player NFT 5
    



    it("Contract Owner may set level and progress matrix", async () => {
        let token = await Characters.deployed();
        await token.setMaxLevel(10, [0,5,10,14,18,21,24,26,28,30]);
    });

    it("Only contract Owner may set level and progress matrix", async () => {
        let token = await Characters.deployed();
        try{
            await token.setMaxLevel(10, [0,5,10,14,18,21,24,26,28,30], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Progress matrix must have same elements as maxLevel", async () => {
        let token = await Characters.deployed();
        try{
            await token.setMaxLevel(15, [0,5,10,14,18,21,24,26,28,30]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must provide a matrix of values of the same lenght than level", "Error is not what is expected");
        }
    });

    it("Only polymath may upgrade player", async () => {
        let token = await Characters.deployed();
        try{
            await token.updateLevel(1, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "only the Polymath can call this function", "Error is not what is expected");
        }
    });

    // progress matrix  [0,5,10,14,18,21,24,26,28,30]
    // player 0 stats   [0,1000,800,1,8,7,6,9,2,3]
    it("Grant Polymath role to account and upgrade the level", async () => {
        
        let token = await Characters.deployed();

        const POLYMATH_ROLE = web3.utils.soliditySha3('POLYMATH_ROLE');
        await token.grantRole(POLYMATH_ROLE, accounts[1]);
        
        let stats1=await token.singleStats(1, {from: accounts[1]});
        
        assert.equal(stats1[2][1], 1000);
        assert.equal(stats1[2][2], 800);
        await token.updateLevel(1, {from: accounts[1]});
        let stats2=await token.singleStats(1, {from: accounts[1]});
        
        assert.equal(stats2[2][1], 1050);
        assert.equal(stats2[2][2], 840);
    });

    it("Cannot upgrade player beyond maxLevel", async () => {
        let token = await Characters.deployed();
        try{
            //Current level 1 (upgraded in las test)
            await token.updateLevel(1, {from: accounts[1]}); //Current level 2
            await token.updateLevel(1, {from: accounts[1]}); //Current level 3
            await token.updateLevel(1, {from: accounts[1]}); //Current level 4
            await token.updateLevel(1, {from: accounts[1]}); //Current level 5
            await token.updateLevel(1, {from: accounts[1]}); //Current level 6
            await token.updateLevel(1, {from: accounts[1]}); //Current level 7
            await token.updateLevel(1, {from: accounts[1]}); //Current level 8
            await token.updateLevel(1, {from: accounts[1]}); //Current level 9
            await token.updateLevel(1, {from: accounts[1]}); //Current level 10 > (maxLevel-1)
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "player is already at max level", "Error is not what is expected");
        }
    });

    //Test set token addr
    //Test default royalties setup
    //Test set royalties and royalties addr

})