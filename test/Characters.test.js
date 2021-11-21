const Characters = artifacts.require("Characters"); //SC characters 
const Equipment = artifacts.require("Equipment");   //SC equipment

const BN = web3.utils.BN;

contract("Equipment test", accounts => {
    const[deployerAddress, tokenAddr1] = accounts;

    it("is possible to mint a character", async() => {
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [0,5,[4,3,2,1,8,7,6,9,2,3],[4,5,6,7,8,9,2,3,4,5,0]]);
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
            await token.mint(tokenAddr1, [0,0,[4,3,2,1,8,7,6,9,2,3],[4,5,6,7,8,9,2,3,4,5,0]], {from: accounts[1]});
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
        await token.mint(tokenAddr1, [2,3,[4,3,2,1,8,7,6,9,2,3],[4,5,6,7,8,9,2,3,4,5,0]], {from: accounts[1]});
      });

    it("Test that getCharacters works", async () => {
        let token = await Characters.deployed();
        await token.mint(tokenAddr1, [4,12,[4,3,2,1,8,7,6,9,2,3],[4,5,6,7,8,9,2,3,4,5,0]]);
        await token.mint(tokenAddr1, [6,16,[4,3,2,1,8,7,6,9,2,3],[4,5,6,7,8,9,2,3,4,5,0]]);
        let characters = await token.getCharacters(tokenAddr1);
        console.log(characters[0]);
        console.log(characters[1]);
        console.log(characters[2]);
        console.log(characters[3]);
        assert.equal(characters.length, 4);
    });
})