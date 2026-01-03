//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Import OpenZeppelin's IERC20 interface for token interactions
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title MerchantService
 * @dev A smart contract for handling micro-payments with automatic loyalty rewards
 * @author LiquidQuick Team
 */
contract MerchantService is Ownable, ReentrancyGuard {
    // The Liquid Token contract address from SoonPay
    IERC20 public immutable liquidToken;

    // Loyalty reward percentage (5% = 500 basis points)
    uint256 public constant LOYALTY_RATE = 500; // 5%
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // Minimum payment amount (to prevent spam)
    uint256 public constant MIN_PAYMENT = 1e18; // 1 LIQUID token

    // Contract's loyalty pool balance
    uint256 public loyaltyPool;

    // Merchant registration
    struct Merchant {
        address walletAddress;
        string businessName;
        bool isActive;
        uint256 totalSales;
        uint256 transactionCount;
    }

    // Transaction record
    struct Transaction {
        address student;
        address merchant;
        uint256 amount;
        uint256 loyaltyReward;
        uint256 timestamp;
    }

    // Mappings
    mapping(address => Merchant) public merchants;
    mapping(address => bool) public isMerchant;
    mapping(address => Transaction[]) public merchantTransactions;
    mapping(address => Transaction[]) public studentTransactions;

    // Events
    event MerchantRegistered(address indexed merchant, string businessName);
    event PaymentProcessed(
        address indexed student,
        address indexed merchant,
        uint256 amount,
        uint256 loyaltyReward,
        uint256 timestamp
    );
    event LoyaltyPoolFunded(uint256 amount);

    /**
     * @dev Constructor sets the Liquid token address
     * @param _liquidTokenAddress The address of the Liquid token contract
     */
    constructor(address _liquidTokenAddress) Ownable(msg.sender) {
        require(_liquidTokenAddress != address(0), "Invalid token address");
        liquidToken = IERC20(_liquidTokenAddress);
    }

    /**
     * @dev Register a new merchant
     * @param _businessName The name of the merchant's business
     */
    function registerMerchant(string memory _businessName) external {
        require(!isMerchant[msg.sender], "Already registered as merchant");
        require(bytes(_businessName).length > 0, "Business name required");

        merchants[msg.sender] = Merchant({
            walletAddress: msg.sender,
            businessName: _businessName,
            isActive: true,
            totalSales: 0,
            transactionCount: 0
        });

        isMerchant[msg.sender] = true;

        emit MerchantRegistered(msg.sender, _businessName);
    }

    /**
     * @dev Process payment from student to merchant with automatic loyalty reward
     * @param _merchant The merchant's wallet address
     * @param _amount The payment amount in LIQUID tokens
     */
    function receivePayment(address _merchant, uint256 _amount) external nonReentrant {
        require(_merchant != address(0), "Invalid merchant address");
        require(isMerchant[_merchant], "Merchant not registered");
        require(merchants[_merchant].isActive, "Merchant not active");
        require(_amount >= MIN_PAYMENT, "Amount below minimum");
        require(msg.sender != _merchant, "Cannot pay yourself");

        // Check student has enough balance
        require(liquidToken.balanceOf(msg.sender) >= _amount, "Insufficient balance");

        // Check allowance
        require(liquidToken.allowance(msg.sender, address(this)) >= _amount, "Insufficient allowance");

        // Calculate loyalty reward (5% of payment)
        uint256 loyaltyReward = (_amount * LOYALTY_RATE) / BASIS_POINTS;

        // Ensure contract has enough loyalty pool for reward
        require(loyaltyPool >= loyaltyReward, "Insufficient loyalty pool");

        // Transfer payment from student to merchant
        bool paymentSuccess = liquidToken.transferFrom(msg.sender, _merchant, _amount);
        require(paymentSuccess, "Payment transfer failed");

        // Transfer loyalty reward from contract to student
        if (loyaltyReward > 0) {
            bool rewardSuccess = liquidToken.transfer(msg.sender, loyaltyReward);
            require(rewardSuccess, "Loyalty reward transfer failed");

            // Deduct from loyalty pool
            loyaltyPool -= loyaltyReward;
        }

        // Update merchant stats
        merchants[_merchant].totalSales += _amount;
        merchants[_merchant].transactionCount += 1;

        // Record transaction
        Transaction memory newTransaction = Transaction({
            student: msg.sender,
            merchant: _merchant,
            amount: _amount,
            loyaltyReward: loyaltyReward,
            timestamp: block.timestamp
        });

        merchantTransactions[_merchant].push(newTransaction);
        studentTransactions[msg.sender].push(newTransaction);

        emit PaymentProcessed(msg.sender, _merchant, _amount, loyaltyReward, block.timestamp);
    }

    /**
     * @dev Fund the loyalty pool (only owner can do this)
     * @param _amount Amount of LIQUID tokens to add to loyalty pool
     */
    function fundLoyaltyPool(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than 0");

        bool success = liquidToken.transferFrom(msg.sender, address(this), _amount);
        require(success, "Transfer failed");

        loyaltyPool += _amount;

        emit LoyaltyPoolFunded(_amount);
    }

    /**
     * @dev Get merchant information
     * @param _merchant The merchant's address
     */
    function getMerchantInfo(
        address _merchant
    ) external view returns (string memory businessName, bool isActive, uint256 totalSales, uint256 transactionCount) {
        Merchant memory merchant = merchants[_merchant];
        return (merchant.businessName, merchant.isActive, merchant.totalSales, merchant.transactionCount);
    }

    /**
     * @dev Get transaction history for a merchant
     * @param _merchant The merchant's address
     */
    function getMerchantTransactions(address _merchant) external view returns (Transaction[] memory) {
        return merchantTransactions[_merchant];
    }

    /**
     * @dev Get transaction history for a student
     * @param _student The student's address
     */
    function getStudentTransactions(address _student) external view returns (Transaction[] memory) {
        return studentTransactions[_student];
    }

    /**
     * @dev Toggle merchant active status (only owner)
     * @param _merchant The merchant's address
     */
    function toggleMerchantStatus(address _merchant) external onlyOwner {
        require(isMerchant[_merchant], "Not a registered merchant");
        merchants[_merchant].isActive = !merchants[_merchant].isActive;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = liquidToken.balanceOf(address(this));
        require(balance > 0, "No balance to withdraw");

        bool success = liquidToken.transfer(owner(), balance);
        require(success, "Withdrawal failed");

        loyaltyPool = 0;
    }
}
