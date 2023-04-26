const { ethers } = require("hardhat");

async function main() {
  const MockErc20 = await ethers.getContractFactory("MockErc20");
  console.log("Deploying Contract");

  const mockErc20 = await MockErc20.deploy("TestToken", "TT");
  await mockErc20.deployed();

  console.log("mockErc20 deployed to :", mockErc20.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
