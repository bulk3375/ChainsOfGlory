var GameCoin = artifacts.require("./GameCoin.sol");

module.exports = function(deployer) {
  deployer.deploy(GameCoin);
};
