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
        await token.mint(tokenAddr1, 1000);
        const balance = await token.balanceOf(tokenAddr1)
        assert.strictEqual(balance.toNumber(), 1000)
    });

})