//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../@rarible/royalties/contracts/impl/RoyaltiesV2Impl.sol";
import "../@rarible/royalties/contracts/LibPart.sol";
import "../@rarible/royalties/contracts/LibRoyaltiesV2.sol";

contract RoyaltyERC721 is ERC721, AccessControlEnumerable, Ownable, RoyaltiesV2Impl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdTracker;
    
    //Adds support for OpenSea
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;

    //Roles of monter and burner
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

    //Used by _beforeTokenTransfer to catch the after minting
    uint private classToMint;

    //Example of struct to attach to any NFT created
    struct NFT_Stats {
        uint class;
        uint stat01;
        uint statnn;
    }

    //Mapping from NFT to struct
    mapping(uint256 => NFT_Stats) private values;

    // Mapping from owner address to token ID. It is used to quickly get all NFTs on an address
    mapping(address => mapping(uint256 => int)) private _tokensByOwner;

    //Generic random counter, used to add a bit more of entropy
    uint randomNonce=0;

    //Pseudo random. I think is enough for the game
    function randMod(uint _modulus) internal returns(uint) {
        randomNonce++; 
        return uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, randomNonce))) % _modulus;
    }

    constructor() ERC721("GENERUC NFT", "GNF")  {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());
    }

    function mint(address _to, uint class) public {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        classToMint=class;
        super._mint(_to, _tokenIdTracker.current()); 
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721) {
        if(from==address(0)) {
            //Minting, creates struct of stats
            values[_tokenIdTracker.current()].class = classToMint;
            values[_tokenIdTracker.current()].stat01 = randMod(100);
            values[_tokenIdTracker.current()].statnn = randMod(100);
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
