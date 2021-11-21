//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "./rarible/royalties/contracts/LibPart.sol";
import "./rarible/royalties/contracts/LibRoyaltiesV2.sol";

contract Characters is ERC721, AccessControlEnumerable, Ownable, RoyaltiesV2Impl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    //Adds support for OpenSea
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    //Roles of monter and burner
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    //Stats of players and enemies
    struct Char_Stats {
        uint class;	        //Internal class 0 for player, index of enemies
        uint level;     	//By default is 0. Evolvable NFTs may upgrade this level
        uint stat01;    	//Health
        uint stat02;    	//Vitality
        uint stat03;    	//Attack
        uint stat04;    	//Defense
        uint stat05;    	//Mastery
        uint stat06;    	//Speed
        uint stat07;    	//Luck
        uint stat08;    	//Faith
    }

    //Used by _beforeTokenTransfer to catch the after minting
    Char_Stats private statsToMint;


    //Mapping from NFT to struct
    mapping(uint256 => Char_Stats) private values;

    // Mapping from owner address to token ID. It is used to quickly get all NFTs on an address
    mapping(address => mapping(uint256 => int)) private _tokensByOwner;

    //Mapping from CharacterID => (mapping slot => equipementId)
    mapping( uint256 => mapping (uint256 => uint256)) private equiped;

    //Generic random counter, used to add a bit more of entropy
    uint randomNonce=0;

    //Pseudo random. I think is enough for the game
    function randMod(uint _modulus) internal returns(uint) {
        randomNonce++; 
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randomNonce))) % _modulus;
    }

    constructor() ERC721("Chains of Glory Characters", "CGC")  {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
    }

    function mint(address _to, Char_Stats memory stats) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        
        //Stores the struct to assign when mint os ok
        statsToMint=stats;
        super._mint(_to, _tokenIdTracker.current()); 
    }

    //Returns the single stats of the PJ (without applying any equipement)
    function singleStats(uint256 idPJ) public view returns(Char_Stats memory) {
        return values[idPJ];
    }

    //Returns the actual stats of the player calculating all the equped gear
    function calculatedStats(uint256 idPJ) public view returns(Char_Stats memory) {
        Char_Stats memory single = values[idPJ];
        // TODO TODO TODO => suma las stats de todos los drops equipados
        return single;
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        if(from==address(0)) {
            //Minting ok, creates struct of stats
            values[_tokenIdTracker.current()] = statsToMint;
            _tokenIdTracker.increment();

            //Updates the _tokensByOwner mapping
            _tokensByOwner[to][tokenId]+=1;
        } else if(to==address(0)) {
            //Burning

            //Updates the _tokensByOwner mapping
             _tokensByOwner[from][tokenId]-=1;
        } else {
            //Normal transfer

            //Updates the _tokensByOwner mapping
            _tokensByOwner[from][tokenId]-=1;
            _tokensByOwner[to][tokenId]+=1;
        }
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
}
