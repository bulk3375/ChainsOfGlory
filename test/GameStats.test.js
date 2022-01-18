const GameStats = artifacts.require("GameStats"); //SC GameStats

const BN = web3.utils.BN;

contract("GameStats test", (accounts) => {
  const [deployerAddress, tokenAddr1, tokenAddr2] = accounts;

  it("All stats are empty", async () => {
    let sc = await GameStats.deployed();

    let races = await sc.numRaces();
    assert.equal(races.toString(), '0');

    let equipment = await sc.numEquipment();
    assert.equal(equipment.toString(), '0');

    let enemies = await sc.numEnemies();
    assert.equal(enemies.toString(), '0');

    let quests = await sc.numQuests();
    assert.equal(quests.toString(), '0');    
  });

  it("Only MASTER_ROLE can mint races, equipment, enemies and quests", async () => {
    let sc = await GameStats.deployed();
    try{
      await sc.addRace([[[0,1,2,3,4,5,6,7]]], {from: accounts[1]});
        assert.fail("The transaction should have thrown an error");
    }
    catch (err) {
        assert.include(err.message, "is missing role", "Error is not what is expected");
    }

    try{
      await sc.addEquipment([0, [[0,1,2,3,4,5,6,7]]], {from: accounts[1]});
        assert.fail("The transaction should have thrown an error");
    }
    catch (err) {
        assert.include(err.message, "is missing role", "Error is not what is expected");
    }

    try{
      await sc.addEnemy([[0,1,2]], {from: accounts[1]});
        assert.fail("The transaction should have thrown an error");
    }
    catch (err) {
        assert.include(err.message, "is missing role", "Error is not what is expected");
    }

    try{
      await sc.addQuest([0, [0,1]], {from: accounts[1]});
        assert.fail("The transaction should have thrown an error");
    }
    catch (err) {
        assert.include(err.message, "is missing role", "Error is not what is expected");
    }

  });

  it("Create some races and modify one", async () => {
    let sc = await GameStats.deployed();

    await sc.addRace([[[0,1,2,3,4,5,6,7]]]);
    let race = await sc.raceAt(0);       
    assert.equal(race[0][0].length, 8);
    assert.equal(race[0][0][5], 5);

    await sc.addRace([[[1,1,2,3,4,5,6,7]]]);
    await sc.addRace([[[2,1,2,3,4,5,6,7]]]);
    await sc.addRace([[[3,1,2,3,4,5,6,7]]]);
    await sc.addRace([[[4,1,2,3,4,5,6,7]]]);

    let numRaces = await sc.numRaces();
    assert.equal(numRaces, 5);

    await sc.replaceRace([[[9,9,9,9,9,9,9,9]]], 2);

    let raceMod = await sc.raceAt(2);       
    assert.equal(raceMod[0][0][5], 9);

  });

  it("Create some equipment and modify one", async () => {
    let sc = await GameStats.deployed();

    await sc.addEquipment([0, [[0,1,2,3,4,5,6,7]]]);
    let equipment = await sc.equipmentAt(0);       
    assert.equal(equipment[1][0].length, 8);
    assert.equal(equipment[1][0][5], 5);

    await sc.addEquipment([1,[[1,1,2,3,4,5,6,7]]]);
    await sc.addEquipment([2,[[2,1,2,3,4,5,6,7]]]);
    await sc.addEquipment([3,[[3,1,2,3,4,5,6,7]]]);
    await sc.addEquipment([4,[[4,1,2,3,4,5,6,7]]]);

    let numEquipment = await sc.numEquipment();
    assert.equal(numEquipment, 5);

    await sc.replaceEquipment([2,[[9,9,9,9,9,9,9,9]]], 2);

    let equipmentMod = await sc.equipmentAt(2);       
    assert.equal(equipmentMod[1][0][5], 9);

  });

  it("Create some enemies and modify one", async () => {
    let sc = await GameStats.deployed();

    await sc.addEnemy([[0,1,2]]);
    let enemy = await sc.enemyAt(0);       
    assert.equal(enemy[0].length, 3);
    assert.equal(enemy[0][2], 2);

    await sc.addEnemy([[1,1,2]]);
    await sc.addEnemy([[2,1,2]]);
    await sc.addEnemy([[3,1,2]]);
    await sc.addEnemy([[4,1,2]]);

    let numEnemy = await sc.numEnemies();
    assert.equal(numEnemy, 5);

    await sc.replaceEnemy([[9,9,9]], 2);

    let enemyMod = await sc.raceAt(2);       
    assert.equal(enemyMod[0][0][1], 9);

  });

  it("Create some quests and modify one", async () => {
    let sc = await GameStats.deployed();

    await sc.addQuest([0, [0,1]]);
    let quest = await sc.questAt(0);       
    assert.equal(quest[1].length, 2);
    assert.equal(quest[1][1], 1);

    await sc.addQuest([1,[1,1]]);
    await sc.addQuest([2,[2,1]]);
    await sc.addQuest([3,[3,1]]);
    await sc.addQuest([4,[4,1]]);

    let numQuests = await sc.numQuests();
    assert.equal(numQuests, 5);

    await sc.replaceQuest([2,[9,9]], 2);

    let questMod = await sc.questAt(2);       
    assert.equal(questMod[1][1], 9);

  });

});
