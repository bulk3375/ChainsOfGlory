//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "./rarible/royalties/contracts/LibPart.sol";
import "./rarible/royalties/contracts/LibRoyaltiesV2.sol";

import "./GameStats.sol";
import "./Equipment.sol";

contract Characters is ERC721, AccessControlEnumerable, Ownable, RoyaltiesV2Impl {

    /**********************************************
     **********************************************
                    VARIABLES
    **********************************************                    
    **********************************************/

    GameStats internal _gameStats;  //Address of GameStats SC
    Equipment internal _gearNFT;    //Address of equipement NFT SC

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    //Adds support for OpenSea
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    //Roles of minter, poolymath and quest (timelocker)
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant POLYMATH_ROLE = keccak256("POLYMATH_ROLE"); //May upgrade player level
    bytes32 public constant QUEST_ROLE = keccak256("QUEST_ROLE");       //May set timeLocks

    //Royaties address and amount
    address payable private _royaltiesAddress;
    uint96 _royaltiesBasicPoints;

    //Stats of players and enemies
    struct charData {
        string      name;           //Character given name
        uint16      race;	        //Race of character.  An index to the GameStats races array
        uint16      level;      	//By default is 0. Evolvable NFTs may upgrade this level        

        uint256[11] gear;           //0-Head 1-Neck 2-Chest 3-Belt 4-Legs 5-Feet 6-Arms 
                                    //7-RHand (weapon) 8-LHand(complement) 9-Finger 10-Mount
                                    //NOTE: slot #0 in the Equipment SC means wildcard
                                    //That means that what is in gear[n] matches slot n+1 in Equipment struct
                                    //NOTE: Value 0 in any position means empty.

        uint256     timeLock;       //Timestamp until the player is locked (mission time)
        uint256     lastCache;      //Last timestamp the calcucaltedStats has been calculated
        GameStats.BaseStats   cachedStats;
        //Change gear and/or update level will trigger a cache reload
        //if globalCacheTimestamp is greater than lastCache it will also trigger a reload
    }

    //When a nerfing is done admin must set globalCacheTimestamp to 'now'
    //to force the refresh of all cachedStats
    uint256 private globalCacheTimestamp;

    //Used by _beforeTokenTransfer to catch the after minting
    charData private statsToMint;

    //maximum level a player can go. 
    //This value may be updated based on the current tier
    //For first tier we may limit to 10, the for second to 20, etc...
    //The upgrade matrix MUST be also updated in order to go further with tiers
    uint maxLevel;

    //It MUST contains the coeficients to apply to each level upgrade
    //There must be the same amount of element as maxLevel
    //For example, in tier 1 maxLevel=10
    //upgradeMatrix=[0, 5, 10, 14, 18, 21, 24, 26, 28, 30]
    //Each level means the percentage of upgrade for the level regarding the basic stats    
    uint16[] upgradeMatrix;


    //Mapping from NFT to struct
    mapping(uint256 => charData) private values;

    // Mapping from owner address to token ID. It is used to quickly get all NFTs off an address
    mapping(address => uint256[]) private _tokensByOwner;



    /**********************************************
     **********************************************
                    CONSTRUCTOR
    **********************************************                    
    **********************************************/
    constructor() ERC721("Chains of Glory Characters", "CGC") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(POLYMATH_ROLE, _msgSender());
        _setupRole(QUEST_ROLE, _msgSender());

        //Set royalties address and amount
        _royaltiesBasicPoints=1500;  //Contract creator by default
        _royaltiesAddress=payable(address(this)); //15% default

        charData memory char;

        //Creates the 0 NFT which is special. Means 'no character'
        statsToMint=char;
        super._mint(_msgSender(), _tokenIdTracker.current());
    }

    /**********************************************
     **********************************************
                    MINTER
              SETTERS AND GETTERS
    **********************************************                    
    **********************************************/

    //Creation of a player
    //Only MINTER_ROLE may create a player
    function mint(address _to, string memory cname, uint16 race) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        require(race<_gameStats.numRaces(), "Exception: race index out of bounds");
        charData memory data;
        //Stores the struct to assign when mint os ok
        statsToMint=data;
        data.name=cname;
        data.race=race;
        super._mint(_to, _tokenIdTracker.current()); 
    }

    //Equipment Token Address
    function setEquipmentAddress(address equipment) public onlyOwner {
        _gearNFT=Equipment(equipment);
    }

     function setGameStatsAddress(address gameStats) public onlyOwner {
        _gameStats=GameStats(gameStats);
    }

    function setTimeLock(uint256 playerId, uint timestamp) public {
        require(hasRole(QUEST_ROLE, _msgSender()), "Exception: must have QUEST role to mint");
        values[playerId].timeLock=block.timestamp+timestamp;
    }

    //Royalties Address
    function setRoyaltiesAddress(address payable rAddress) public onlyOwner {
        _royaltiesAddress=rAddress;
    }

    //Royalties fee
    function setRoyaltiesBasicPoints(uint96 rBasicPoints) public onlyOwner {
        _royaltiesBasicPoints=rBasicPoints;
    }

    //Set the max level of the gears
    function setMaxLevel(uint lvl, uint16[] memory matrixValues) public {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        require(lvl == matrixValues.length, "Exception: must provide a matrix of values of the same lenght than level");

        maxLevel=lvl;
        upgradeMatrix=matrixValues;
    }

    function getMatrix() public view returns (uint16[] memory){
        return upgradeMatrix;
    }

    //Returns the array of NFTs owned by an address
    function getCharacters(address powner) public view returns (uint256[] memory) {
        return _tokensByOwner[powner];
    }


    //Returns the charData of the NFT
    function baseStats(uint256 idPJ) public view returns(charData memory) {
        return values[idPJ];
    }

    /**********************************************
     **********************************************
                   UTILITY FUNCTIONS
    **********************************************                    
    **********************************************/

    //Update the level of the player 
    //Only Polymath role can do it. 
    //To recalculate stats function uses the upgrade matrix. See above...
    function updateLevel(uint256 character) public {
        require(values[character].timeLock  < block.timestamp, "Exception: player is locked");
        require(hasRole(POLYMATH_ROLE, _msgSender()), "Exception: only the Polymath can call this function");
        require((values[character].level + 1) < maxLevel, "Exception: player is already at max level");
        
        values[character].level++;

        recalculateStats(character);
    }

    //Equip al gear pased in the array
    //The previous gear is replaced by the new one
    //Can only equip a player owned
    //Can only equip existing gear
    //Can only equip with owned gear
    //Verifies that gear is in the apropriate slot
    //Can only equip gear not used in another players
    function equip(uint256 character, uint256[11] memory gear) public {
        require(ownerOf(character) == _msgSender(), "Exception: must be owner of the player to equip");
        require(values[character].timeLock  < block.timestamp, "Exception: player is locked");
        require(_gearNFT.isValidGearSet(_msgSender(), gear), "Exception: some gear is not valid (wrong: slot, timelock, owner or exists)");
        require(!alreadyEquiped(character, gear), "Exception: some gear is already equiped in other player in mint");
        
        //Set tokenId as the character where the equipment is equipped
        for(uint i=0; i< gear.length; i++) {
            //Unset current equipped
            if(values[character].gear[i]!=0)
                _gearNFT.setCharacter(values[character].gear[i], 0);
            
            //Set new equipped character
            if(gear[i]!=0)
                _gearNFT.setCharacter(gear[i], character);
        }

        //Stores the struct to assign when mint os ok
        values[character].gear=gear;

        recalculateStats(character);
    }

    function updateCache(uint256 idPJ) public onlyOwner {
        if(values[idPJ].lastCache < globalCacheTimestamp) {
            values[idPJ].lastCache=globalCacheTimestamp;
            recalculateStats(idPJ);
        }
    }
    
    //Returns the actual stats of the player calculating all the equped gear and leveling
    function recalculateStats(uint256 idPJ) public {     
        //No calculations for 'empty' character
        if(idPJ==0)
            return;

        //Set cache to racials
        values[idPJ].cachedStats= _gameStats.raceAt(values[idPJ].race).stats;

        //Apply upgrade matrix to racials
        for(uint i=0; i<values[idPJ].cachedStats.values.length; i++)
            values[idPJ].cachedStats.values[i]+=((values[idPJ].cachedStats.values[i] * upgradeMatrix[values[idPJ].level]) / 100);

        //Add all gear to stats
        for(uint i=0; i<values[idPJ].gear.length; i++) {
            if(values[idPJ].gear[i]!=0) {
                //Add stats from gear NFT
                GameStats.BaseStats memory gearStats = _gearNFT.getCachedStats(values[idPJ].gear[i]);
                for(uint j=0; j<gearStats.values.length; j++) {
                    values[idPJ].cachedStats.values[j]+=gearStats.values[j];
                }
            }
        }

        //Update lastCache value
        values[idPJ].lastCache=block.timestamp;
    }

    //Public wrapper of _exists
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }


    /**********************************************
     **********************************************
                   ERC721 FUNCTIONS
    **********************************************                    
    **********************************************/

    //Override of the transfer function
    //Verify that player has no equipment before transfer it
    //hasEquipment do not test the enemies, remember that enemies are only cellectibles for users
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(values[tokenId].timeLock  < block.timestamp, "Exception: player is locked");


        //Unset all equipped gear
        for(uint i=0; i< values[tokenId].gear.length; i++) {
            //Unset current equipped
            if(values[tokenId].gear[i]!=0)
                _gearNFT.setCharacter(values[tokenId].gear[i], 0);
        }

        uint256[11] memory empty;
        values[tokenId].gear=empty;
        super.transferFrom(from, to, tokenId);
    }

    //Override of the function
    //Test what actions has been performed and then asign stats and update the _tokensByOwner 
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        if(from==address(0)) {
            //Minting ok, creates struct of stats
            values[_tokenIdTracker.current()] = statsToMint;
            _tokenIdTracker.increment();

            //When mint a new NFT sets the royalties address
            setRoyalties(tokenId, _royaltiesAddress, _royaltiesBasicPoints);

            //Set tokenId as the character where the equipment is equipped
            for(uint i=0; i< statsToMint.gear.length; i++)
                if(statsToMint.gear[i]!=0)
                    _gearNFT.setCharacter(statsToMint.gear[i], tokenId);

            //Updates the _tokensByOwner mapping            
            _tokensByOwner[to].push(tokenId);

            recalculateStats(tokenId);
        } else if(to==address(0)) {
            //Burning

            //Updates the _tokensByOwner mapping
            deleteTokenId(from, tokenId);
        } else {
            //Normal transfer

            //Updates the _tokensByOwner mapping
            _tokensByOwner[to].push(tokenId);
            deleteTokenId(from, tokenId);
        }
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://www.chainsofglory.com/metadata/";
    }

    function setRoyalties(uint256 _tokenId, address payable _royaltiesReceipientAddress, uint96 _percentageBasisPoints) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        LibPart.Part[] memory _royalties = new LibPart.Part[](1);
        _royalties[0].value = _percentageBasisPoints;
        _royalties[0].account = _royaltiesReceipientAddress;
        _saveRoyalties(_tokenId, _royalties);
    }

    function royaltyInfo(uint256 _tokenId, uint256 _salePrice ) external view returns ( address receiver, uint256 royaltyAmount) {
        LibPart.Part[] memory _royalties = royalties[_tokenId];
        if(_royalties.length > 0) {
            return(_royalties[0].account, (_salePrice * _royalties[0].value)/10000);
        }
        return (address(0), 0);
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, AccessControlEnumerable) returns (bool) {
        if (interfaceId == LibRoyaltiesV2._INTERFACE_ID_ROYALTIES) {
            return true;
        }

        if(interfaceId == _INTERFACE_ID_ERC2981) {
            return true;
        }

        return super.supportsInterface(interfaceId);
    }

    //************************************************************
    // ARRAY functions 
    //************************************************************
    function positionOf(address powner, uint256 tokenId) public view returns (bool, uint) {
        for(uint i=0; i<_tokensByOwner[powner].length; i++) {
            if(_tokensByOwner[powner][i]==tokenId)
                return (true, i);
        }
        return (false, 0);
    }

    function deleteTokenId(address powner, uint256 tokenId) internal {
        //Updates the _tokensByOwner mapping
        (bool found, uint pos)=positionOf(powner, tokenId);
        if(found) {
            _tokensByOwner[powner][pos]= _tokensByOwner[powner][ _tokensByOwner[powner].length-1];
            _tokensByOwner[powner].pop();
        }
    }

    //Test that all gear passed in the data is already equiped in other character   
    function alreadyEquiped(uint256 character, uint256[11] memory gear) internal view returns (bool) {
        
        //test if all gear is unequipped
        for(uint i=0; i< gear.length; i++) {
            if(gear[i]!=0)
                if(_gearNFT.getCharacter(gear[i])!=0 && _gearNFT.getCharacter(gear[i])!=character)
                    return true;
        }

        return false;
    }    

}