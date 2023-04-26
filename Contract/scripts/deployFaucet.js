const { ethers } = require("hardhat");
const { FaucetReserveContractAddress } = require("../constants/index");

async function main() {
  const Faucet = await ethers.getContractFactory("faucet");
  console.log("Deploying Contract");

  const faucet = await Faucet.deploy(FaucetReserveContractAddress);
  await faucet.deployed();

  console.log("Faucet deployed to :", faucet.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
