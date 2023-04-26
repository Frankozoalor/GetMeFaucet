// SPDX-License-Identifier: MIT

pragma solidity ^0.8.14;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockErc20 is ERC20 {
    bool _paused = false;

    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 100 * 10**18);
    }

    function transfer(address recipient_, uint256 amount_)
        public
        override
        returns (bool)
    {
        if (_paused) return false;
        _transfer(msg.sender, recipient_, amount_);
        return true;
    }

    function mint(address receiver_, uint256 amount_) public {
        _mint(receiver_, amount_);
    }
}
