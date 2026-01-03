import { expect } from "chai";
import { ethers } from "hardhat";
import { MerchantService } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("MerchantService", function () {
  let merchantService: MerchantService;
  let owner: HardhatEthersSigner;
  let merchant: HardhatEthersSigner;
  let student: HardhatEthersSigner;

  // Mock Liquid token address (for testing)
  const LIQUID_TOKEN_ADDRESS = "0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564";

  beforeEach(async function () {
    // Get test accounts
    [owner, merchant, student] = await ethers.getSigners();

    // Deploy the contract
    const MerchantServiceFactory = await ethers.getContractFactory("MerchantService");
    merchantService = await MerchantServiceFactory.deploy(LIQUID_TOKEN_ADDRESS);
    await merchantService.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await merchantService.owner()).to.equal(owner.address);
    });

    it("Should set the correct Liquid token address", async function () {
      expect(await merchantService.liquidToken()).to.equal(LIQUID_TOKEN_ADDRESS);
    });

    it("Should have correct loyalty rate", async function () {
      expect(await merchantService.LOYALTY_RATE()).to.equal(500); // 5%
    });
  });

  describe("Merchant Registration", function () {
    it("Should register a merchant successfully", async function () {
      const businessName = "Mama Ntilie's Food Stall";

      await expect(merchantService.connect(merchant).registerMerchant(businessName))
        .to.emit(merchantService, "MerchantRegistered")
        .withArgs(merchant.address, businessName);

      // Check if merchant is registered
      expect(await merchantService.isMerchant(merchant.address)).to.equal(true);

      // Check merchant info
      const merchantInfo = await merchantService.getMerchantInfo(merchant.address);
      expect(merchantInfo.businessName).to.equal(businessName);
      expect(merchantInfo.isActive).to.equal(true);
      expect(merchantInfo.totalSales).to.equal(0);
      expect(merchantInfo.transactionCount).to.equal(0);
    });

    it("Should not allow duplicate merchant registration", async function () {
      const businessName = "Test Business";

      // Register once
      await merchantService.connect(merchant).registerMerchant(businessName);

      // Try to register again
      await expect(merchantService.connect(merchant).registerMerchant(businessName)).to.be.revertedWith(
        "Already registered as merchant",
      );
    });

    it("Should not allow empty business name", async function () {
      await expect(merchantService.connect(merchant).registerMerchant("")).to.be.revertedWith("Business name required");
    });
  });

  describe("Contract Info", function () {
    it("Should return correct constants", async function () {
      expect(await merchantService.LOYALTY_RATE()).to.equal(500);
      expect(await merchantService.BASIS_POINTS()).to.equal(10000);
      expect(await merchantService.MIN_PAYMENT()).to.equal(ethers.parseEther("1"));
    });

    it("Should start with empty loyalty pool", async function () {
      expect(await merchantService.loyaltyPool()).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to toggle merchant status", async function () {
      // Register merchant first
      await merchantService.connect(merchant).registerMerchant("Test Business");

      // Non-owner should not be able to toggle
      await expect(
        merchantService.connect(student).toggleMerchantStatus(merchant.address),
      ).to.be.revertedWithCustomError(merchantService, "OwnableUnauthorizedAccount");

      // Owner should be able to toggle
      await merchantService.connect(owner).toggleMerchantStatus(merchant.address);

      const merchantInfo = await merchantService.getMerchantInfo(merchant.address);
      expect(merchantInfo.isActive).to.equal(false);
    });
  });
});
