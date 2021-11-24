var GameCoin = artifacts.require("GameCoin");

module.exports = function(deployer) {
  deployer.deploy(GameCoin, 1000); //Deploy with 1000 initial supply
};
