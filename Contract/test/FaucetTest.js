const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("ethers");
const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");

describe("Faucet", function () {
  let FaucetContract;
  let FaucetDeployment;
  let owner;
  let alice;
  let bob;
  let FaucetReserve;
  let faucetReserve;

  beforeEach(async function () {
    FaucetReserve = await ethers.getContractFactory("MockErc20");
    faucetReserve = await FaucetReserve.deploy("TestToken", "TT");
    await faucetReserve.deployed();

    FaucetDeployment = await ethers.getContractFactory("faucet");
    FaucetContract = await FaucetDeployment.deploy(faucetReserve.address);
    await FaucetContract.deployed();

    [owner, alice, bob] = await hre.ethers.getSigners();
  });

  describe("Confirming State", function () {
    it("should confirm the address of the owner", async () => {
      const fetchOwner = await FaucetContract.owner();
      expect(fetchOwner).to.eq(owner.address);
    });

    it("should confirm the faucetAmount", async () => {
      const faucetAmount = await FaucetContract.faucetAmount();
      expect(faucetAmount).to.eq(parseEther("10"));
    });

    it("should confirm the lockTime amount", async () => {
      const lockTime = await FaucetContract.lockTime();
      expect(lockTime).to.eq(BigNumber.from(60));
    });

    it("should confirm faucetReserve", async () => {
      const faucetReserveAddress_ = await FaucetContract.faucetReserve();
      expect(faucetReserveAddress_).to.eq(faucetReserve.address);
    });

    it("should confirm owner balance", async () => {
      const ownerBalance = await faucetReserve.balanceOf(owner.address);
      expect(ownerBalance).to.eq(parseEther("100"));
    });
  });

  describe("transaction", function () {
    it("should send tokens to the faucet contract ", async () => {
      await faucetReserve.mint(bob.address, parseEther("100"));
      await faucetReserve.mint(alice.address, parseEther("100"));
      const bobBalance = await faucetReserve.balanceOf(bob.address);

      await faucetReserve
        .connect(bob)
        .transfer(FaucetContract.address, parseEther("100"));
      await faucetReserve
        .connect(alice)
        .transfer(FaucetContract.address, parseEther("100"));
      const FaucetContranctBalance = await faucetReserve.balanceOf(
        FaucetContract.address
      );
      expect(FaucetContranctBalance).to.eq(parseEther("200"));
    });

    it("should send faucet to the requestor", async () => {
      await faucetReserve.mint(bob.address, parseEther("200"));
      await faucetReserve
        .connect(bob)
        .transfer(FaucetContract.address, parseEther("100"));

      await FaucetContract.connect(alice).getFaucet();
      const aliceAddress = await faucetReserve.balanceOf(alice.address);
      expect(aliceAddress).to.eq(parseEther("10"));
    });

    it("should withdraw faucet balance ", async () => {
      await faucetReserve.mint(bob.address, parseEther("200"));
      await faucetReserve
        .connect(bob)
        .transfer(FaucetContract.address, parseEther("200"));

      await FaucetContract.withdraw();

      const faucetReserveBalanceAfter = await faucetReserve.balanceOf(
        FaucetContract.address
      );
      const ownerBalance = await faucetReserve.balanceOf(owner.address);
      expect(faucetReserveBalanceAfter).to.eq(parseEther("0"));
      expect(ownerBalance).to.eq(parseEther("300"));
    });
  });

  describe("checks", function () {
    it("should revert if there is not enough token in the faucet", async () => {
      await expect(FaucetContract.getFaucet()).to.be.revertedWith(
        "Not enough tokens"
      );
    });

    it(" should send order created events after getting faucet", async () => {
      await faucetReserve.mint(bob.address, parseEther("200"));
      await faucetReserve
        .connect(bob)
        .transfer(FaucetContract.address, parseEther("100"));

      const txn = await FaucetContract.connect(alice).getFaucet();
      const receipt = await txn.wait();
      const receiptTimestamp = (
        await ethers.provider.getBlock(receipt.blockNumber)
      ).timestamp;
      expect(txn)
        .to.emit(FaucetContract, "OrderCreated")
        .withArgs(0, alice.address, parseEther("10"), receiptTimestamp);

      expect((await FaucetContract.orderById(0)).requestor).to.eq(
        alice.address
      );

      expect((await FaucetContract.orderById(0)).amount).to.eq(
        parseEther("10")
      );

      expect((await FaucetContract.orderById(0)).timestamp).to.eq(
        receiptTimestamp
      );
    });

    it("should check time constraints in getting faucets", async () => {
      await faucetReserve.mint(bob.address, parseEther("200"));
      await faucetReserve
        .connect(bob)
        .transfer(FaucetContract.address, parseEther("100"));

      const txn1 = await FaucetContract.connect(alice).getFaucet();

      //Expecting call to revert when same caller tries to Make a second attempt to get faucet before 1 minute
      const txn2 = await expect(
        FaucetContract.connect(alice).getFaucet()
      ).be.revertedWith("Please try again in 1 minute");

      //Moving the time 1 minute and calling getFaucet(), This time i expect it to pass
      await ethers.provider.send("evm_increaseTime", [60]);

      const txn3 = await FaucetContract.connect(alice).getFaucet();
    });
  });
});
