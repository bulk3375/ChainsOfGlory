//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/Context.sol";

contract GameToken is Context, AccessControlEnumerable, Ownable, ERC20 {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    //address public contractOwner;

    constructor(uint256 initialSupply) ERC20( "Chains of Gloty Token", "CGT") {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());

        _setupRole(MINTER_ROLE, _msgSender());
        _setupRole(BURNER_ROLE, _msgSender());

        _mint(msg.sender, initialSupply);
    }

    function decimals() public pure override returns (uint8) {
		return 0;
	}

    function mint(address to, uint256 amount) public virtual {
        require(hasRole(MINTER_ROLE, _msgSender()), "Exception: must have minter role to mint");
        _mint(to, amount);
    }

    function burn(uint256 amount) public virtual {
        require(hasRole(BURNER_ROLE, _msgSender()), "Exception: must have burner role to burn");
        _burn(_msgSender(), amount);
    }

    function burn(address from, uint256 amount) public virtual {
        require(hasRole(BURNER_ROLE, _msgSender()), "Exception: must have burner role to burn");
        _burn(from, amount);
    }
}