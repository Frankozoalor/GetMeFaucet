const { expect } = require("chai");
const { ethers } = require("hardhat");
const hre = require("hardhat");
const { parseEther } = require("ethers/lib/utils");
const { parse } = require("dotenv");

describe("MockERC20", function () {
  let MockERC20;
  let mockERC20;
  let owner;
  let alice;
  let bob;

  beforeEach(async function () {
    MockERC20 = await ethers.getContractFactory("MockErc20");
    [owner, alice, bob] = await hre.ethers.getSigners();

    mockERC20 = await MockERC20.deploy("TestToken", "TT");
    await mockERC20.deployed();
  });

  describe("Transaction", function () {
    it("should confirm that owner has the apporiate amount of tokens", async () => {
      const ownerAmount = await mockERC20.balanceOf(owner.address);
      expect(ownerAmount).to.eq(parseEther("100"));
    });
    it("should mint tokens to accounts", async () => {
      await mockERC20.mint(alice.address, parseEther("50"));
      const aliceAmount = await mockERC20.balanceOf(alice.address);
      expect(aliceAmount).to.eq(parseEther("50"));
    });

    it("it should transfer tokens to another account", async () => {
      await mockERC20.mint(alice.address, parseEther("50"));
      await mockERC20.connect(alice).transfer(bob.address, parseEther("50"));
      const bobAmount = await mockERC20.balanceOf(bob.address);
      expect(bobAmount).to.eq(parseEther("50"));
    });

    it("it should fail if sender doesnt have enough tokens", async () => {
      expect(
        await mockERC20.transfer(alice.address, parseEther("50"))
      ).to.revertedWith("ERC20: transfer amount exceeds balance");
    });
  });
});
