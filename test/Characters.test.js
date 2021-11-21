const Characters = artifacts.require("Characters"); //SC characters 
const Equipment = artifacts.require("Equipment");   //SC equipment

const BN = web3.utils.BN;

contract("Equipment test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;

    
    it("is possible to mint a character", async() => {
        let token = await Characters.deployed();
        //Set the gear adress into Character SC    
        await token.setEquipmentAddress(Equipment.address);

        await token.mint(tokenAddr1, [0,5,[0,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
    });

    it("Cannot mint using unexisting gear", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,1,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear used does not exists", "Error is not what is expected");
        }
    });

    it("Can mint using gear that own", async () => {
        let gear = await Equipment.deployed();
        //Mint a gear for slot 1 (head)
        await gear.mint(tokenAddr1, [0,1,0,[1,2,3,4,5,6,7,8,9,10]]);

        //Assign gear to arrd1 NFT 1
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [0,0,[1,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0]]);

    });

    it("Cannot mint using gear on wong slot", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,1,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not in the apropriate slot", "Error is not what is expected");
        }
    });

    it("Cannot mint using gear that do not own", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr2, [0,0,[0,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "player does not own all gear", "Error is not what is expected");
        }
    });

    it("Cannot mint using gear already equiped", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[1,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is already equiped in other player", "Error is not what is expected");
        }
    });

    it("is possible to set royalties", async() => {
        let token = await Characters.deployed();
        await token.setRoyalties(0, deployerAddress, 1000);
        let royalties = await token.getRaribleV2Royalties(0);
        assert.equal(royalties[0].value, '1000');
        assert.equal(royalties[0].account, deployerAddress);
    });

    it("works with ERC2981 Royalties", async() => {
        let token = await Characters.deployed();
        await token.setRoyalties(0, deployerAddress, 1000);
        let royalties = await token.royaltyInfo(0, 100000);
        assert.equal(royalties.royaltyAmount.toString(), '10000');
        assert.equal(royalties.receiver, deployerAddress);
    });

    it("Only MINTER_ROLE can mint NFT", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must have minter role to mint", "Error is not what is expected");
        }
    });

    it("Contract Owner may assign MINTER_ROLE to other account", async () => {
        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        let token = await Characters.deployed();
        await token.grantRole(MINTER_ROLE, accounts[1]);
        await token.mint(tokenAddr1, [1,0,[2,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]], {from: accounts[1]});
    });

    it("Test that getCharacters works", async () => {
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [2,0,[3,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
        await token.mint(tokenAddr1, [3,0,[4,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
        let characters = await token.getCharacters(tokenAddr1);        
        //console.log(characters[0].toNumber());
        //console.log(characters[3].toNumber());
        assert.equal(characters.length, 5);
    });

    //So far we got 5 tokens minted to acc 1
    it("NFT Owner can transfer to another account and _tokensByOwner balances are updated", async () => {
        let token = await Characters.deployed();
        await token.transferFrom(tokenAddr1, tokenAddr2, 0, {from: accounts[1]});      
        let characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 4);
        assert.notEqual(characters1[0].toNumber(), 0);
        let characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 1);
        assert.equal(characters2[0].toNumber(), 0);        
        
        //Leave balances as it was and test again balances
        await token.transferFrom(tokenAddr2, tokenAddr1, 0, {from: accounts[2]});      
        characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 5);
        characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 0);
    });

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

    it("Test that singleStats works", async () => {
        let token = await Characters.deployed();
        
        //Get stats of NFT 0
        let stats = await token.singleStats(0);                
        assert.equal(stats[0].toNumber(), 0);
        assert.equal(stats[1].toNumber(), 3);

        //Get stats of NFT 1
        stats = await token.singleStats(1);
        assert.equal(stats[0].toNumber(), 1);
        assert.equal(stats[1].toNumber(), 3);
    });

    it("Test that calculatedStats works", async () => {
        let token = await Characters.deployed();
        
        //Get stats of NFT 0
        let stats = await token.singleStats(1);                
        assert.equal(stats[0].toNumber(), 1);
        assert.equal(stats[1].toNumber(), 3);

        // PJ Stats     [1,3,2,1,8,7,6,9,2,3]
        //Gear Stats    [1,2,3,4,5,6,7,8,9,10]
        //Get stats of NFT 1
        stats = await token.calculatedStats(1);
        assert.equal(stats[0].toNumber(), 2);
        assert.equal(stats[1].toNumber(), 5);
    });

    it("Test that cannot equip a player that I do not own", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(0, [0,0,0,0,0,0,0,0,0,0,0]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must be owner of the player to equip", "Error is not what is expected");
        }
    });

    it("Test that cannot equip gear that does not exists", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(0, [0,5,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear used does not exists in equip", "Error is not what is expected");
        }                
    });

    it("Test that cannot equip gear that does not own", async () => {
        let token = await Characters.deployed();
        try{
            await token.mint(tokenAddr2, [3,0,[5,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
            await token.equip(5, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[2]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "player does not own all gear in equip", "Error is not what is expected");
        }                
    });

    it("Test that cannot equip gear in the wrong slot", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(0, [0,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            await token.equip(0, [0,1,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not in the apropriate slot in equip", "Error is not what is expected");
        }                
    });

    it("Test that cannot equip gear already equiped", async () => {
        let token = await Characters.deployed();
        try{
            await token.equip(0, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            await token.equip(1, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is already equiped in other player in equip", "Error is not what is expected");
        }                
    });
})