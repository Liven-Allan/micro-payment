import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the MerchantService contract
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployMerchantService: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  /*
    On localhost, the deployer account is the one that comes with Hardhat, which is already funded.

    When deploying to live networks (e.g `yarn deploy --network sepolia`), the deployer account
    should have sufficient balance to pay for the gas fees for contract creation.

    You can generate a random account with `yarn generate` which will fill DEPLOYER_PRIVATE_KEY
    with a random private key in the .env file (then used on hardhat.config.ts)
    You can run the `yarn account` command to check your balance in every network.
  */
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  // For local development, we'll use the mock token
  // In production, this would be the actual Liquid token address: 0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564
  let LIQUID_TOKEN_ADDRESS = "0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564";

  // Use mock token on local networks
  if (hre.network.name === "localhost" || hre.network.name === "hardhat") {
    const mockLiquidToken = await hre.ethers.getContract("MockLiquidToken");
    LIQUID_TOKEN_ADDRESS = await mockLiquidToken.getAddress();
    console.log("🧪 Using MockLiquidToken for local testing:", LIQUID_TOKEN_ADDRESS);
  }

  await deploy("MerchantService", {
    from: deployer,
    // Contract constructor arguments
    args: [LIQUID_TOKEN_ADDRESS],
    log: true,
    // autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
    // automatically mining the contract deployment transaction. There is no effect on live networks.
    autoMine: true,
  });

  // Get the deployed contract to interact with it after deploying.
  const merchantService = await hre.ethers.getContract<Contract>("MerchantService", deployer);
  console.log("👋 MerchantService deployed to:", await merchantService.getAddress());
  console.log("🏪 Liquid Token Address:", LIQUID_TOKEN_ADDRESS);

  // Log some initial information
  console.log("📊 Contract Info:");
  console.log("   - Loyalty Rate:", await merchantService.LOYALTY_RATE(), "basis points (5%)");
  console.log("   - Minimum Payment:", await merchantService.MIN_PAYMENT(), "wei");
  console.log("   - Current Loyalty Pool:", await merchantService.loyaltyPool());
};

export default deployMerchantService;

// Tags are useful if you have multiple deploy files and only want to run one of them.
// e.g. yarn deploy --tags MerchantService
deployMerchantService.tags = ["MerchantService"];
