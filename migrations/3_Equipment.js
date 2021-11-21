var Equipment = artifacts.require("./Equipment.sol");

module.exports = function(deployer) {
  deployer.deploy(Equipment);
};
