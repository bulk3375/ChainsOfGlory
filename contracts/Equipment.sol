//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "./rarible/royalties/contracts/LibPart.sol";
import "./rarible/royalties/contracts/LibRoyaltiesV2.sol";

import "./GameCoin.sol";

contract Equipment is ERC721, AccessControlEnumerable, Ownable, RoyaltiesV2Impl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    //Adds support for OpenSea
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    //Roles of monter and burner
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant POLYMATH_ROLE = keccak256("POLYMATH_ROLE");

    //Game Token Address
    GameCoin private _gameCoin;

    //Royaties address and amntou
    address payable private _royaltiesAddress;
    uint96 _royaltiesBasicPoints;

    //Stats of players and enemies
    struct gearStats {
        uint class;	            //Index on the NFT for client use
        uint slot;		        //0-Head 1-Neck 2-Chest 3-Belt 4-Legs 5-Feet 6-Arms 
                                //7-RHand (weapon) 8-LHand(complement) 9-Finger 10-Mount 100-Wildcard
        uint level;     	    //By default is 0. Evolvable NFTs may upgrade this level
        uint256[10] stats;      //0-Health 1-Vitality 2-Attack 3-Defense 4-Mastery 
                                //5-Speed 6-Luck 7-Faith 8-reserved 9-reserved 
                                //NOTE: We use last two for the store, PRICE IN TOKENS AT POS 9!!
        //NOTE: DO NOT USE DECIMALS, INSTEAD MULTIPLY BY 100
    }

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
    uint256[] upgradeMatrix;

    //Gear offered in the stores
    //Administrators may update, delete or modify the content
    //The store should read this array and populate the store acording to it
    gearStats[] public storeGear;


    //Used by _beforeTokenTransfer to catch the after minting
    gearStats private gearToMint;


    //Mapping from NFT to struct
    mapping(uint256 => gearStats) private values;

    // Mapping from owner address to token ID. It is used to quickly get all NFTs on an address
    mapping(address => uint256[]) private _tokensByOwner;

    //Generic random counter, used to add a bit more of entropy
    uint randomNonce=0;

    constructor() ERC721("Chains of Glory Equipment", "CGE") payable {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
        _setupRole(POLYMATH_ROLE, _msgSender());

        //Royaties address and amntou
        _royaltiesAddress=payable(address(this)); //Contract creator by default
        _royaltiesBasicPoints=1500; //15% default

        gearStats memory gear;
        //Creates the 0 NFT which is special. Means 'empty slot' for the characters
        mint(_msgSender(), gear);
    }

    function mint(address _to, gearStats memory data) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        
        //Stores the struct to assign when mint os ok
        gearToMint=data;
        super._mint(_to, _tokenIdTracker.current()); 
    }

    //GameToken Token Address
    function setGameCoinAddress(address gameTokenAddress) public onlyOwner {
        _gameCoin=GameCoin(gameTokenAddress);
    }

    //GameToken Token Address
    function setRoyaltiesAddress(address payable rAddress) public onlyOwner {
        _royaltiesAddress=rAddress;
    }

    //GameToken Token Address
    function setRoyaltiesBasicPoints(uint96 rBasicPoints) public onlyOwner {
        _royaltiesBasicPoints=rBasicPoints;
    }

    //Update the level of the gear and recalculates all stats
    //Only Polymath role can do it. 
    //To recalculate stats function uses the upgrade matrix. See above...
    function updateLevel(uint256 gear) public {
        require(hasRole(POLYMATH_ROLE, _msgSender()), "Exception: only the Polymath can call this function");
        require((values[gear].level + 1) < maxLevel, "Exception: equipment is already at max level");
        
        values[gear].level++;
    }

    //Set the max level of the gears
    function setMaxLevel(uint lvl, uint256[] memory matrixValues) public {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        require(lvl == matrixValues.length, "Exception: must provide a matrix of values of the same lenght than level");

        maxLevel=lvl;
        upgradeMatrix=matrixValues;
    }

    function getMatrix() public view returns (uint256[] memory){
        return upgradeMatrix;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        if(from==address(0)) {
            //Minting ok, creates struct of stats
            values[_tokenIdTracker.current()] = gearToMint;
            _tokenIdTracker.increment();

            //When mint a new NFT sets the royalties address
            setRoyalties(tokenId, _royaltiesAddress, _royaltiesBasicPoints);

            //Updates the _tokensByOwner mapping            
            _tokensByOwner[to].push(tokenId);
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

    //Returns the base gearStats of the NFT 
    function baseStats(uint256 idGear) public view returns(gearStats memory) {
        return values[idGear];
    }

    //Returns the gearStats of the NFT aplying the level modifier
    function singleStats(uint256 idGear) public view returns(gearStats memory) {
        gearStats memory baseGear;
        baseGear=values[idGear];
        if(baseGear.level!=0) {
            uint256 multiplier=upgradeMatrix[baseGear.level];        
            for(uint i=0; i< baseGear.stats.length; i++) { //Remkember that last 2 are reserved!!
                baseGear.stats[i]+=(baseGear.stats[i]*multiplier)/100;
            }
        }
        return baseGear;
    }

    //Returns the array of NFTs owned by an address
    function getEquipment(address powner) public view returns (uint256[] memory) {
        return _tokensByOwner[powner];
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://exampledomain/metadata/";
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

    //Public wrapper of _exists
    function exists(uint256 tokenId) public view returns (bool) {
        return _exists(tokenId);
    }

    //Pseudo random. I think is enough for the game
    function randMod(uint _modulus) internal returns(uint) {
        randomNonce++; 
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randomNonce))) % _modulus;
    }

    //************************************************************
    // ARRAY functions 
    //************************************************************
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


    //STORE FUNCTIONALITY
    //
    //Store is where the user may pay in game tokens for equipment

    //Add an element to the store array
    function addGearToStore(gearStats memory gear) public {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        require(!gearExistsInStore(gear), "Exception: Element already exists in the array");
        storeGear.push(gear);
    }


    //Remove an element from the store array
    function removeGearFromStore(uint256 index) public {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        require(index < storeGear.length, "Exception: Index out of bounds");

        storeGear[index]= storeGear[ storeGear.length-1];
        storeGear.pop();
    }

    //Manages the purchase
    function purchase(uint256 index) external {
        require(index < storeGear.length, "Exception: Index out of bounds");
        require(_gameCoin.transferFrom(msg.sender, address(this), storeGear[index].stats[9]));

        //Mint the gear to the payer
        mint(msg.sender, storeGear[index]);
    }

    function gearExistsInStore(gearStats memory gear) internal view returns (bool) {
        for(uint i=0; i<storeGear.length; i++) {
            if( gear.class==storeGear[i].class &&
                gear.slot==storeGear[i].slot &&
                gear.level==storeGear[i].level &&
                gear.stats[0]==storeGear[i].stats[0] &&
                gear.stats[1]==storeGear[i].stats[1] &&
                gear.stats[2]==storeGear[i].stats[2] &&
                gear.stats[3]==storeGear[i].stats[3] &&
                gear.stats[4]==storeGear[i].stats[4] &&
                gear.stats[5]==storeGear[i].stats[5] &&
                gear.stats[6]==storeGear[i].stats[6] &&
                gear.stats[7]==storeGear[i].stats[7] &&
                gear.stats[8]==storeGear[i].stats[8] &&
                gear.stats[9]==storeGear[i].stats[9]
                )
                    return true;
        }
        return false;
    }
}
