const Characters = artifacts.require("Characters"); //SC characters 
const Equipment = artifacts.require("Equipment");   //SC equipment

const BN = web3.utils.BN;

contract("Equipment test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;

    /*
    addr1 => PJ NFT(0)
    */
    it("is possible to mint a character", async() => {
        let token = await Characters.deployed();
        //Set the gear adress into Character SC    
        await token.setEquipmentAddress(Equipment.address);

        await token.mint(tokenAddr1, [0,5,[0,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
    });

    /*
    addr1 => PJ NFT(0)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
    it("Can mint using gear that own", async () => {
        let gear = await Equipment.deployed();
        //Mint a gear for slot 1 (head)
        await gear.mint(tokenAddr1, [0,0,0,[1,2,3,4,5,6,7,8,9,10]]); //class=0 slot=0 level=0
        
        //Assign gear to address1 NFT 1
        //Remember that tequiopment 0 is created on SC deployment and represetn no item at all!!
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [0,0,[1,3,2,1,8,7,6,9,2,3],[1,0,0,0,0,0,0,0,0,0,0]]);

    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
    it("Cannot mint using gear on wong slot", async () => {
        let token = await Characters.deployed();
        try{
            //Cannot equip Gear 1 on slot 1 because is for slot 0
            await token.mint(tokenAddr1, [0,0,[0,3,2,1,8,7,6,9,2,3],[0,1,0,0,0,0,0,0,0,0,0]]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "some gear is not in the apropriate slot", "Error is not what is expected");
        }
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
    it("is possible to set royalties", async() => {
        let token = await Characters.deployed();
        await token.setRoyalties(0, deployerAddress, 1000);
        let royalties = await token.getRaribleV2Royalties(0);
        assert.equal(royalties[0].value, '1000');
        assert.equal(royalties[0].account, deployerAddress);
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
    it("works with ERC2981 Royalties", async() => {
        let token = await Characters.deployed();
        await token.setRoyalties(0, deployerAddress, 1000);
        let royalties = await token.royaltyInfo(0, 100000);
        assert.equal(royalties.royaltyAmount.toString(), '10000');
        assert.equal(royalties.receiver, deployerAddress);
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    */
    it("Contract Owner may assign MINTER_ROLE to other account", async () => {
        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        let token = await Characters.deployed();
        await token.grantRole(MINTER_ROLE, accounts[1]);
        await token.mint(tokenAddr1, [1,0,[2,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]], {from: accounts[1]});
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
    it("Test that getCharacters works", async () => {
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [2,0,[3,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
        await token.mint(tokenAddr1, [3,0,[4,3,2,1,8,7,6,9,2,3],[0,0,0,0,0,0,0,0,0,0,0]]);
        let characters = await token.getCharacters(tokenAddr1);        
        //console.log(characters[0].toNumber());
        //console.log(characters[3].toNumber());
        assert.equal(characters.length, 5);
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
    it("Cannot transfer a player wearing any equipment", async () => {
        let token = await Characters.deployed();
        try{
            await token.transferFrom(tokenAddr1, tokenAddr2, 1, {from: accounts[1]});      
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "cannot transfer a player wearing any equipment", "Error is not what is expected");
        }
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
    it("test that unequipAndTransferFrom really unequip and transfer", async () => {

        //before transfer has 1 gear
        let gear = await Equipment.deployed();
        let equipment = await gear.getEquipment(tokenAddr1);
        assert.equal(equipment.length, 1);

        let token = await Characters.deployed();
        //Transfer PJ 0 fro add1 to addr2
        await token.unequipAndTransferFrom(tokenAddr1, tokenAddr2, 1, {from: accounts[1]});      
        let characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 4);
        assert.notEqual(characters1[1].toNumber(), 1);
        let characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 1);
        assert.equal(characters2[0].toNumber(), 1);
        
        //After equipment still has 1 gear
        equipment = await gear.getEquipment(tokenAddr1);
        assert.equal(equipment.length, 1);
        
        //Leave balances as it was and test again balances
        await token.transferFrom(tokenAddr2, tokenAddr1, 1, {from: accounts[2]});      
        characters1 = await token.getCharacters(tokenAddr1);
        assert.equal(characters1.length, 5);
        characters2 = await token.getCharacters(tokenAddr2);
        assert.equal(characters2.length, 0);

        //Equip again gear 1
        await token.equip(1, [1,0,0,0,0,0,0,0,0,0,0], {from: accounts[1]});
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
    //So far we got 5 PJs minted to addr 1 and 1 gear mninter to addr1
    it("NFT Owner can transfer and _tokensByOwner balances are updated", async () => {
        let token = await Characters.deployed();
        //Transfer PJ 0 fro add1 to addr2
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
    it("Test that calculatedStats works", async () => {
        let token = await Characters.deployed();
        
        //Get stats of NFT 1
        let stats = await token.singleStats(1);                
        assert.equal(stats[0].toNumber(), 1);
        assert.equal(stats[1].toNumber(), 3);

        //PJ Stats      [1,3,2,1,8,7,6,9,2,3]
        //Gear Stats    [1,2,3,4,5,6,7,8,9,10]
        //Get stats of NFT 1
        stats = await token.calculatedStats(1);
        assert.equal(stats[0].toNumber(), 2); //1+1
        assert.equal(stats[1].toNumber(), 5); //3+2
        assert.equal(stats[9].toNumber(), 13); //3+10
    });

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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

    /*
    addr1 => PJ NFT(0)
    addr1 => GEAR NFT(0)
    Equiped G(0) on PJ(1)

    addr1 => PJ NFT(1)
    addr1 => PJ NFT(2)
    addr1 => PJ NFT(3)
    addr1 => PJ NFT(4)
    */
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