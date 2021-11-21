var Characters = artifacts.require("./Characters.sol");

module.exports = function(deployer) {
  deployer.deploy(Characters);
};
