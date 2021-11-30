const Characters = artifacts.require("Characters"); //SC characters 
const Equipment = artifacts.require("Equipment");   //SC equipment

const BN = web3.utils.BN;

//REMEMBER!!! Token 0 is already minted by SC
//All minting starts from 1 in advance
contract("Equipment test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;

    it("is possible to mint an qequipment", async() => {
        let charac = await Characters.deployed();
        let token = await Equipment.deployed();
        //Set the gear adress into Character SC    
        await charac.setEquipmentAddress(Equipment.address);

        await token.mint(tokenAddr1, [0,0,0,[1000,800,0,0,0,0,0,0,0,0],0]);
    });

    it("is possible to set royalties", async() => {
        let token = await Equipment.deployed();
        await token.setRoyalties(1, deployerAddress, 1000);
        let royalties = await token.getRaribleV2Royalties(1);
        assert.equal(royalties[0].value, '1000');
        assert.equal(royalties[0].account, deployerAddress);
    });

    it("works with ERC2981 Royalties", async() => {
        let token = await Equipment.deployed();
        await token.setRoyalties(1, deployerAddress, 1000);
        let royalties = await token.royaltyInfo(1, 100000);
        assert.equal(royalties.royaltyAmount.toString(), '10000');
        assert.equal(royalties.receiver, deployerAddress);
    });

    it("Only MINTER_ROLE can mint NFT", async () => {
        let token = await Equipment.deployed();
        try{
            await token.mint(tokenAddr1, [0,0,0,[0,0,1200,1100,0,0,0,0,0,0],0], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must have minter role to mint", "Error is not what is expected");
        }
    });

    it("Contract Owner may assign MINTER_ROLE to other account", async () => {
        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        let token = await Equipment.deployed();
        await token.grantRole(MINTER_ROLE, accounts[1]);
        await token.mint(tokenAddr1, [0,0,0,[0,0,1200,1100,0,0,0,0,0,0],0], {from: accounts[1]});
    });

    it("Contract Owner may set level and progress matrix", async () => {
        let token = await Equipment.deployed();
        await token.setMaxLevel(10, [0,5,10,14,18,21,24,26,28,30]);
    });

    it("Only contract Owner may set level and progress matrix", async () => {
        let token = await Equipment.deployed();
        try{
            await token.setMaxLevel(10, [0,5,10,14,18,21,24,26,28,30], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Progress matrix must have same elements as maxLevel", async () => {
        let token = await Equipment.deployed();
        try{
            await token.setMaxLevel(15, [0,5,10,14,18,21,24,26,28,30]);
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "must provide a matrix of values of the same lenght than level", "Error is not what is expected");
        }
    });

    it("Only polymath may upgrade gear", async () => {
        let token = await Equipment.deployed();
        try{
            await token.updateLevel(1, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "only the Polymath can call this function", "Error is not what is expected");
        }
    });

    // progress matrix  [0,5,10,14,18,21,24,26,28,30]
    // Gear 0 stats     [10,10,0,0,0,0,0,0,0,0]
    it("Grant Polymath role to account and upgrade the level", async () => {
        
        let token = await Equipment.deployed();

        const POLYMATH_ROLE = web3.utils.soliditySha3('POLYMATH_ROLE');
        await token.grantRole(POLYMATH_ROLE, accounts[1]);
        
        let stats1=await token.singleStats(1, {from: accounts[1]});
        
        assert.equal(stats1[3][0], 1000);
        assert.equal(stats1[3][1], 800);
        await token.updateLevel(1, {from: accounts[1]});
        let stats2=await token.singleStats(1, {from: accounts[1]});
        
        assert.equal(stats2[3][0], 1050);
        assert.equal(stats2[3][1], 840);
    });

    it("Cannot upgrade gear beyond maxLevel", async () => {
        let token = await Equipment.deployed();
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
            assert.include(err.message, "equipment is already at max level", "Error is not what is expected");
        }
    });

    //Test set token addr
    //Test default royalties setup
    //Test set royalties and royalties addr
    //Test add gear to store
    //Test remove gear from store
    //Test purchase

})