// SPDX-License-Identifier: MIT
pragma solidity ^0.8.14;

import "hardhat/console.sol";

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract faucet is ReentrancyGuard {
    using Counters for Counters.Counter;

    Counters.Counter public orderIdTracker;

    IERC20 public faucetReserve;
    address public owner;
    uint256 public faucetAmount = 10 * (10**18);
    uint256 public lockTime = 1 minutes;

    constructor(address faucetReserveAddress_) {
        require(
            faucetReserveAddress_ != address(0),
            "Token address is a null address"
        );
        faucetReserve = IERC20(faucetReserveAddress_);
        owner = msg.sender;
    }

    event OrderCreated(uint256 orderId, address requestor, uint256 amount);
    event Deposit(address from, uint256 amount);

    struct FaucetOrder {
        address requestor;
        uint256 amount;
        uint256 timestamp;
    }

    mapping(uint256 => FaucetOrder) public orderById;
    mapping(address => uint256) accessTime;

    function donateFaucet() public payable {}

    function getBalance() external view returns (uint256) {
        return faucetReserve.balanceOf(address(this));
    }

    function getFaucet() public nonReentrant {
        uint256 orderId = orderIdTracker.current();
        orderIdTracker.increment();
        require(msg.sender != address(0), "Address cannot be a zero address");
        require(
            faucetReserve.balanceOf(address(this)) > faucetAmount,
            "Not enough tokens"
        );
        require(
            block.timestamp >= accessTime[msg.sender],
            "Please try again in 1 minute"
        );

        FaucetOrder storage order = orderById[orderId];

        order.requestor = msg.sender;
        order.amount = faucetAmount;
        order.timestamp = block.timestamp;

        accessTime[msg.sender] = block.timestamp + lockTime;

        bool success = faucetReserve.transfer(msg.sender, faucetAmount);
        require(success, "Transaction not successful");

        emit OrderCreated(orderId, msg.sender, faucetAmount);
    }

    function setFaucetAmount(uint256 amount) public onlyOwner {
        faucetAmount = amount * (10**18);
    }

    function setLockTime(uint256 time) public onlyOwner {
        lockTime = time * 1 minutes;
    }

    function withdraw() external onlyOwner {
        faucetReserve.transfer(
            msg.sender,
            faucetReserve.balanceOf(address(this))
        );
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this funcition");
        _;
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value);
    }
}
