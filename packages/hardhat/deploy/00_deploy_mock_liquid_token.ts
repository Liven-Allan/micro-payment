import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the MockLiquidToken contract for local testing
 */
const deployMockLiquidToken: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // Only deploy on local networks
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    await deploy("MockLiquidToken", {
      from: deployer,
      args: [],
      log: true,
      autoMine: true,
    });

    // Get the deployed contract
    const mockLiquidToken = await hre.ethers.getContract<Contract>("MockLiquidToken", deployer);
    const tokenAddress = await mockLiquidToken.getAddress();

    console.log("🪙 MockLiquidToken deployed to:", tokenAddress);

    // Mint tokens to test accounts
    const testAccounts = [
      "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Account #0 (Merchant)
      "0x70997970C51812dc3A010C7d01b50e0d17dc79C8", // Account #1 (Student)
      "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC", // Account #2
    ];

    for (const account of testAccounts) {
      await mockLiquidToken.mint(account, hre.ethers.parseEther("10000")); // 10,000 LIQUID tokens
      console.log(`� Minted 1 0,000 LIQUID tokens to ${account}`);
    }
  }
};

export default deployMockLiquidToken;
deployMockLiquidToken.tags = ["MockLiquidToken"];
