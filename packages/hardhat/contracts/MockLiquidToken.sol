//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockLiquidToken
 * @dev A mock LIQUID token for local testing
 */
contract MockLiquidToken is ERC20, Ownable {
    
    constructor() ERC20("Liquid Token", "LIQUID") Ownable(msg.sender) {
        // Mint initial supply to deployer
        _mint(msg.sender, 1000000 * 10**decimals()); // 1 million tokens
    }
    
    /**
     * @dev Mint tokens to any address (for testing purposes)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    /**
     * @dev Faucet function - anyone can get 1000 LIQUID tokens for testing
     */
    function faucet() external {
        require(balanceOf(msg.sender) < 100 * 10**decimals(), "You already have enough tokens");
        _mint(msg.sender, 1000 * 10**decimals()); // Give 1000 LIQUID tokens
    }
}