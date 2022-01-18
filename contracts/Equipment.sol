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
import "./Characters.sol";

contract Equipment is ERC721, AccessControlEnumerable, Ownable, RoyaltiesV2Impl {

    /**********************************************
     **********************************************
                    VARIABLES
    **********************************************                    
    **********************************************/

    //GameStats smart contract
    GameStats internal _gameStats;

    //Characters smart contract
    Characters internal _characters;


    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    //Adds support for OpenSea
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    //Roles of monter and burner
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant POLYMATH_ROLE = keccak256("POLYMATH_ROLE"); //May upgrade player level
    bytes32 public constant QUEST_ROLE = keccak256("QUEST_ROLE");       //May set timeLocks
    bytes32 public constant CHARATCRER_ROLE = keccak256("CHARATCRER_ROLE"); //May set equipedIn

    //Royaties address and amntou
    address payable private _royaltiesAddress;
    uint96 private _royaltiesBasicPoints;

    //Stats of players and enemies
    struct gearData {
        uint256  class;	        //Type of NFT
        uint16  level;     	    //By default is 0. Evolvable NFTs may upgrade this level
        uint256 timeLock;       //Timestamp until the player is locked (mission time)

        uint256 equipedIn;      //Character index where the gear is equipped

        uint256     lastCache;  //Last timestamp the calcucaltedStats has been calculated
        GameStats.BaseStats   cachedStats;
        //Change gear and/or update level will trigger a cache reload
        //if globalCacheTimestamp is greater than lastCache it will also trigger a reload
    }

    //When a nerfing is done admin must set globalCacheTimestamp to 'now'
    //to force the refresh of all cachedStats
    uint256 private globalCacheTimestamp;

    //maximum level a gear can go. 
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

    //Used by _beforeTokenTransfer to catch the after minting
    gearData private gearToMint;


    //Mapping from NFT to struct
    mapping(uint256 => gearData) private values;

    // Mapping from owner address to token ID. It is used to quickly get all NFTs on an address
    mapping(address => uint256[]) private _tokensByOwner;


    /**********************************************
     **********************************************
                    CONSTRUCTOR
    **********************************************                    
    **********************************************/
    constructor() ERC721("Chains of Glory Equipment", "CGE") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(POLYMATH_ROLE, _msgSender());
        _setupRole(QUEST_ROLE, _msgSender());

        //Royaties address and amntou
        _royaltiesAddress=payable(address(this)); //Contract creator by default
        _royaltiesBasicPoints=1500; //15% default

        gearData memory gear;

        //Creates the 0 NFT which is special. Means 'empty slot'
        gearToMint=gear;
        super._mint(_msgSender(), _tokenIdTracker.current());
    }

    /**********************************************
     **********************************************
                    MINTER
              SETTERS AND GETTERS
    **********************************************                    
    **********************************************/

    //Minter
    function mint(address _to, gearData memory data) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        require(data.class<_gameStats.numEquipment(), "Exception: equipment index out of bounds");
        //Stores the struct to assign when mint os ok
        gearToMint=data;
        super._mint(_to, _tokenIdTracker.current());
    }

    //Set functions

    //GameToken Token Address
    function setGameStatsAddress(address gameStats) public onlyOwner {
        _gameStats=GameStats(gameStats);
    }

    function setCharactersAddress(address characters) public onlyOwner {
        _characters=Characters(characters);
        _setupRole(CHARATCRER_ROLE, characters);
    }

    
    function setRoyaltiesAddress(address payable rAddress) public onlyOwner {
        _royaltiesAddress=rAddress;
    }

    function setRoyaltiesBasicPoints(uint96 rBasicPoints) public onlyOwner {
        _royaltiesBasicPoints=rBasicPoints;
    }

    //Set timelock
    function setTimeLock(uint256 gearId, uint timestamp) public {
        require(hasRole(QUEST_ROLE, _msgSender()), "Exception: must have QUEST role to set timelocks");
        require(exists(gearId),"Exception: Gear does not existst");
        values[gearId].timeLock=block.timestamp+timestamp;
    }

    //Set the max level of the gears
    function setMaxLevel(uint lvl, uint16[] memory matrixValues) public onlyOwner {
        require(lvl == matrixValues.length, "Exception: must provide a matrix of values of the same lenght than level");

        maxLevel=lvl;
        upgradeMatrix=matrixValues;

        //Set cache timnestamp to current
        //This will force updateCache to call recalculateStats
        //The problem is... who will trigger the call and pay the fees?!?!?
        globalCacheTimestamp=block.timestamp;
    }

    function getMatrix() public view returns (uint16[] memory){
        return upgradeMatrix;
    }

    //Returns the base gearStats of the NFT 
    function getGearData(uint256 idGear) public view returns(gearData memory) {
        return values[idGear];
    }

    //Returns the gearStats of the NFT aplying the level modifier
    function getGearStats(uint256 idGear) public view returns(GameStats.EquipmentItem memory) {        
        return _gameStats.equipmentAt(values[idGear].class);
    }

    function getCachedStats(uint256 idGear) public view returns(GameStats.BaseStats memory) {
        return values[idGear].cachedStats;
    }

    //Returns the array of NFTs owned by an address
    function getEquipment(address powner) public view returns (uint256[] memory) {
        return _tokensByOwner[powner];
    }

    //GameToken Token Address
    function getSlot(uint256 gear) public view returns (uint8 slot)  {
        GameStats.EquipmentItem memory item = _gameStats.equipmentAt(values[gear].class);
        return item.slot;
    }

    function getCharacter(uint256 gear) public view returns (uint256){
        return values[gear].equipedIn;
    }

    function setCharacter(uint256 gear, uint256 character) public  {
        require(hasRole(CHARATCRER_ROLE, _msgSender()), "Exception: only CHARATCRER_ROLE can call this function");
        if(gear!=0)
            values[gear].equipedIn=character;
    }

    /**********************************************
     **********************************************
                   UTILITY FUNCTIONS
    **********************************************                    
    **********************************************/

    function isValidGearSet(address player, uint256[11] memory gear) public view returns (bool) {
        for(uint i=0; i<gear.length; i++) {
            
            if(gear[i]==0)
                continue;

            //Gear timelocked
            if(values[gear[i]].timeLock  >= block.timestamp)
                return false;

            //Gear NFT exists?
            if(!_exists(gear[i]))
                return false;

            //player own all gear?
            if(ownerOf(gear[i])!=player)
                return false;    
            
            //gear are in apropriate slots?
            if(getSlot(gear[i])!=100 && getSlot(gear[i])!=i) // slot 100 is for wildcards
                return false;
        }
        return true;
    }

    //Update the level of the gear and recalculates all stats
    //Only Polymath role can do it. 
    //To recalculate stats function uses the upgrade matrix. See above...
    function updateLevel(uint256 gear) public {
        require(values[gear].timeLock  < block.timestamp, "Exception: equipment is locked");
        require(hasRole(POLYMATH_ROLE, _msgSender()), "Exception: only the Polymath can call this function");
        require((values[gear].level + 1) < maxLevel, "Exception: equipment is already at max level");
        
        values[gear].level++;
        recalculateStats(gear);
    }

    //Public wrapper of _exists
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    function updateCache(uint256 idGear) public onlyOwner {
        if(values[idGear].lastCache < globalCacheTimestamp) {
            values[idGear].lastCache=globalCacheTimestamp;
            recalculateStats(idGear);
        }
    }

    //Returns the actual stats of the player calculating all the equiped gear and leveling
    function recalculateStats(uint256 idGear) internal { 
        //No calculations for 'empty' equipment
        if(idGear==0)
            return;

        GameStats.EquipmentItem memory eqGear = _gameStats.equipmentAt(values[idGear].class);
        
        for(uint i=0; i<eqGear.stats.values.length; i++)
            values[idGear].cachedStats.values[i]=eqGear.stats.values[i] + ((eqGear.stats.values[i] * upgradeMatrix[values[idGear].level]) / 100);

        values[idGear].lastCache=block.timestamp;

        if(values[idGear].equipedIn!=0)
            _characters.recalculateStats(values[idGear].equipedIn);

    }

    /**********************************************
     **********************************************
                   ERC721 FUNCTIONS
    **********************************************                    
    **********************************************/

    //Override of the transfer function
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        require(values[tokenId].timeLock  < block.timestamp, "Exception: equipment is locked");
        require(values[tokenId].equipedIn  == 0, "Exception: cannot transfer an equipped item");

        super.transferFrom(from, to, tokenId);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        require(values[tokenId].timeLock  < block.timestamp, "Exception: equipment is locked");
        if(from==address(0)) {
            //Minting ok, creates struct of stats
            values[_tokenIdTracker.current()] = gearToMint;
            _tokenIdTracker.increment();

            //When mint a new NFT sets the royalties address
            setRoyalties(tokenId, _royaltiesAddress, _royaltiesBasicPoints);

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

    

    /**********************************************
     **********************************************
                REVERSE ARRAY FUNCTIONS
    **********************************************                    
    **********************************************/

    function positionOf(address powner, uint256 tokenId) public view returns (uint) {
        for(uint i=0; i<_tokensByOwner[powner].length; i++) {
            if(_tokensByOwner[powner][i]==tokenId)
                return i;
        }
        return _tokensByOwner[powner].length+100;
    }

    function deleteTokenId(address powner, uint256 tokenId) internal {
        //Updates the _tokensByOwner mapping
        uint pos=positionOf(powner, tokenId);
        if(pos<_tokensByOwner[powner].length) {
            _tokensByOwner[powner][pos]= _tokensByOwner[powner][ _tokensByOwner[powner].length-1];
            _tokensByOwner[powner].pop();
        }
    }

}