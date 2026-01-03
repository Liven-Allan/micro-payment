# 💰 Micro-Payment System

A decentralized micro-payment solution built on Ethereum that enables seamless transactions between merchants and students using liquid tokens. This system provides a secure, efficient, and transparent way to handle small-value transactions in educational and commercial environments.

## 🎯 Overview

The Micro-Payment System is designed to facilitate quick and cost-effective transactions between two main parties:

### 👨‍💼 **Merchant Role**
- **Service Provider**: Merchants can register their services and set pricing
- **Payment Receiver**: Accept liquid token payments from students
- **Transaction Management**: View transaction history and manage received payments
- **QR Code Generation**: Generate QR codes for easy payment collection
- **Balance Tracking**: Monitor liquid token balance and transaction volumes

### 🎓 **Student/Buyer Role**
- **Token Holder**: Hold and manage liquid tokens for payments
- **Payment Initiator**: Make payments to merchants using liquid tokens
- **QR Scanner**: Scan merchant QR codes for quick payments
- **Transaction History**: View payment history and spending patterns
- **Balance Management**: Check liquid token balance and top-up when needed

## 🚀 Key Features

- **Liquid Token System**: Custom ERC-20 token for micro-payments
- **QR Code Payments**: Quick payment processing via QR code scanning
- **Real-time Balance Updates**: Instant balance updates after transactions
- **Transaction History**: Complete audit trail of all payments
- **Merchant Registration**: Easy onboarding for service providers
- **Student Wallet**: Intuitive interface for payment management
- **Gas Optimization**: Efficient smart contracts to minimize transaction costs

## 🛠 Technology Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **Smart Contracts**: Solidity, Hardhat
- **Blockchain**: Ethereum (local development with Hardhat Network)
- **Web3 Integration**: Wagmi, Viem, RainbowKit
- **Development**: Scaffold-ETH 2 framework

## 📋 Requirements

Before you begin, ensure you have the following installed:

- [Node.js (>= v18.18)](https://nodejs.org/en/download/)
- [Yarn (v1 or v2+)](https://yarnpkg.com/getting-started/install)
- [Git](https://git-scm.com/downloads)

## 🚀 Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/Liven-Allan/micro-payment.git
cd micro-payment
```

2. **Install dependencies**:
```bash
yarn install
```

3. **Start local blockchain**:
```bash
yarn chain
```

4. **Deploy smart contracts**:
```bash
yarn deploy
```

5. **Start the application**:
```bash
yarn start
```

6. **Access the application**:
   - Open `http://localhost:3000` in your browser
   - Connect your wallet
   - Navigate to `/merchant` for merchant interface
   - Navigate to `/student` for student interface

## 📁 Project Structure

```
micro-payment/
├── packages/
│   ├── hardhat/                 # Smart contracts and deployment
│   │   ├── contracts/
│   │   │   ├── MerchantService.sol    # Main merchant service contract
│   │   │   └── MockLiquidToken.sol    # Liquid token contract
│   │   ├── deploy/              # Deployment scripts
│   │   └── test/                # Contract tests
│   └── nextjs/                  # Frontend application
│       ├── app/
│       │   ├── merchant/        # Merchant interface
│       │   └── student/         # Student interface
│       ├── components/          # Reusable components
│       └── hooks/               # Custom React hooks
```

## 🔧 Smart Contracts

### MerchantService.sol
- Handles merchant registration and service management
- Processes payments between students and merchants
- Manages transaction records and balances

### MockLiquidToken.sol
- ERC-20 token implementation for the payment system
- Provides minting capabilities for testing
- Handles token transfers and balance management

## 🧪 Testing

Run the smart contract tests:
```bash
yarn hardhat:test
```

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENCE) file for details.

## 🔗 Links

- **Repository**: [https://github.com/Liven-Allan/micro-payment](https://github.com/Liven-Allan/micro-payment)
- **Issues**: [Report bugs or request features](https://github.com/Liven-Allan/micro-payment/issues)

---

Built with ❤️ using Scaffold-ETH 2