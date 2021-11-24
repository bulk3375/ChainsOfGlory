const GameCoin = artifacts.require("GameCoin"); //SC characters 
const Equipment = artifacts.require("Equipment");   //SC equipment

const BN = web3.utils.BN;

contract("Character test", accounts => {
    const[deployerAddress, tokenAddr1, tokenAddr2] = accounts;    
        
     /*
    addr1 => PJ NFT(0)
    */
    it("is possible to mint some tokens", async() => {
        let token = await GameCoin.deployed();

        
        let equipment = await Equipment.deployed();
        await token.setEquipmentAddress(Equipment.address);
        const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
        await equipment.grantRole(MINTER_ROLE, GameCoin.address);

        await token.mint(tokenAddr1, 1000);
        const balance = await token.balanceOf(tokenAddr1)
        assert.strictEqual(balance.toNumber(), 1000)
    });

    it("Only MINTER_ROLE can mint Tokrn", async () => {
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

    //Now acc 1 has 1900 tokens
    it("Contract Owner may add gear to the store", async () => {
        let token = await GameCoin.deployed();
        await token.addGearToStore([0,0,0,[1000,800,0,0,0,0,0,0,0,50]]);
        await token.addGearToStore([0,1,0,[0,0,1200,900,0,0,0,0,0,150]]);
        await token.addGearToStore([0,2,0,[0,0,1200,900,0,0,0,0,0,150]]);
        await token.addGearToStore([0,3,0,[0,0,1200,900,0,0,0,0,0,500]]);
        await token.addGearToStore([0,4,0,[0,0,1200,900,0,0,0,0,0,5000]]);
    });

    it("Only Owner can add gear to the store", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.addGearToStore([0,0,0,[1000,800,0,0,0,0,0,0,0,50]], {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Contract Owner may remove gear to the store", async () => {
        let token = await GameCoin.deployed();

        let balance = await token.getEquipmentLength();
        assert.strictEqual(balance.toNumber(), 5)
        await token.removeGearFromStore(0);
        balance = await token.getEquipmentLength();
        assert.strictEqual(balance.toNumber(), 4)
    });

    it("Only Owner can remove gear from the store", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.removeGearFromStore(0, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "caller is not the owner", "Error is not what is expected");
        }
    });

    it("Player may putchase an item", async () => {
        let token = await GameCoin.deployed();
        let equipment = await Equipment.deployed();
        
        await token.purchase(2, {from: accounts[1]});
        let balance = await equipment.balanceOf(accounts[1]);
        
        assert.strictEqual(balance.toNumber(), 1)

        balance = await token.balanceOf(accounts[1])
    });

    it("Player can not putchase an item more expensive than his funds", async () => {
        let token = await GameCoin.deployed();
        try{
            await token.purchase(0, {from: accounts[1]});
            assert.fail("The transaction should have thrown an error");
        }
        catch (err) {
            assert.include(err.message, "transfer amount exceeds balance", "Error is not what is expected");
        }
    });
    
})