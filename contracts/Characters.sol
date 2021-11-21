//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "./rarible/royalties/contracts/LibPart.sol";
import "./rarible/royalties/contracts/LibRoyaltiesV2.sol";

import "./Equipment.sol";

contract Characters is ERC721, AccessControlEnumerable, Ownable, RoyaltiesV2Impl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    //Adds support for OpenSea
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    //Roles of monter and burner
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    Equipment internal _gearNFT;      //Address of equipement NFT SC

    //Stats of players and enemies
    //Stats of players and enemies
    struct charData {
        uint256 class;	        //Internal class 0 for player, index of enemies
        uint256 level;      	//By default is 0. Evolvable NFTs may upgrade this level
        uint256[10] stats;      //0-Health 1-Vitality 2-Attack 3-Defense 4-Mastery 
                                //5-Speed 6-Luck 7-Faith 8-reserved 9-reserved
        uint256[10] gear;       //0-Head 1-Neck 2-Chest 3-Belt 4-Legs 5-Feet 6-Arms 
                                //7-RHand (weapon) 8-LHand(complement) 9-Finger 10-Mount
    }

    //Used by _beforeTokenTransfer to catch the after minting
    charData private statsToMint;


    //Mapping from NFT to struct
    mapping(uint256 => charData) private values;

    // Mapping from owner address to token ID. It is used to quickly get all NFTs off an address
    mapping(address => uint256[]) private _tokensByOwner;

    //Generic random counter, used to add a bit more of entropy
    uint randomNonce=0;

    constructor() ERC721("Chains of Glory Characters", "CGC")  {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
    }

    function mint(address _to, charData memory data) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        
        //Stores the struct to assign when mint os ok
        statsToMint=data;
        super._mint(_to, _tokenIdTracker.current()); 
    }

    
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        if(from==address(0)) {
            //Minting ok, creates struct of stats
            values[_tokenIdTracker.current()] = statsToMint;
            _tokenIdTracker.increment();

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

    //Returns the single stats of the PJ (without applying any equipement)
    function singleStats(uint256 idPJ) public view returns(uint256[10] memory) {
        return values[idPJ].stats;
    }

    //Returns the actual stats of the player calculating all the equped gear
    function calculatedStats(uint256 idPJ) public view returns(uint256[10] memory) {
        uint256[10] memory single = values[idPJ].stats;
        for(uint i=0; i<values[idPJ].gear.length; i++) {
            if(values[idPJ].gear[i]!=0) {
                //Add stats from gear NFT
                Equipment.gearStats memory gear = _gearNFT.singleStats(values[idPJ].gear[i]);
                for(uint j=0; j<single.length; j++) {
                    single[j]+=gear.stats[j];
                }
            }
        }
        return single;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return "https://exampledomain/metadata/";
    }

    function setRoyalties(uint256 _tokenId, address payable _royaltiesReceipientAddress, uint96 _percentageBasisPoints) public onlyOwner {
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

    //Pseudo random. I think is enough for the game
    function randMod(uint _modulus) internal returns(uint) {
        randomNonce++; 
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randomNonce))) % _modulus;
    }

    //************************************************************
    // ARRAY functions 
    //************************************************************
    function positionOf(address owner, uint256 tokenId) public view returns (uint) {
        for(uint i=0; i<_tokensByOwner[owner].length; i++) {
            if(_tokensByOwner[owner][i]==tokenId)
                return i;
        }
        return _tokensByOwner[owner].length+100;
    }

    function deleteTokenId(address owner, uint256 tokenId) internal {
        //Updates the _tokensByOwner mapping
        uint pos=positionOf(owner, tokenId);
        if(pos<_tokensByOwner[owner].length) {
            _tokensByOwner[owner][pos]= _tokensByOwner[owner][ _tokensByOwner[owner].length-1];
            _tokensByOwner[owner].pop();
        }
    }

    //Equipment Token Address
    function setEquipmentAddress(address equipment) public onlyOwner {
        _gearNFT=Equipment(equipment);
    }
}
