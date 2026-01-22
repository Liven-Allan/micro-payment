# 🚀 Micro Payments DApp - Testnet Deployment Guide

This guide will walk you through deploying your Micro Payments DApp to **Sepolia Testnet** with Vercel frontend and SoonPay integration. This gives you a fully functional live application without mainnet costs!

## 📋 **Prerequisites**

### **Required Accounts & Services**
- ✅ GitHub account with repository: `https://github.com/Liven-Allan/micro-payment`
- ✅ Vercel account (sign up at https://vercel.com) - **FREE**
- ✅ Alchemy account for RPC endpoints (https://dashboard.alchemy.com) - **FREE**
- ✅ Etherscan account for contract verification (https://etherscan.io/apis) - **FREE**
- ✅ SoonPay developer account (for testnet integration) - **FREE**
- ✅ Ethereum wallet with Sepolia ETH (MetaMask recommended) - **FREE from faucets**

### **Required Tools**
- Node.js 20.18.3+
- Yarn package manager
- Git

---

## 🏗️ **Phase 1: Smart Contract Deployment (Sepolia Testnet)**

### **Step 1: Environment Setup**

#### **1.1 Create Testnet Environment File**
```bash
# Navigate to hardhat package
cd packages/hardhat

# Create testnet environment file
cp .env.example .env
```

#### **1.2 Configure Hardhat Environment Variables**
Edit `packages/hardhat/.env`:

```bash
# Alchemy API Key (get from https://dashboard.alchemy.com)
ALCHEMY_API_KEY=your_alchemy_api_key_here

# Deployer Private Key (NEVER commit this to git)
DEPLOYER_PRIVATE_KEY=your_private_key_here

# Etherscan API Key (for contract verification)
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

⚠️ **SECURITY WARNING**: Never commit private keys to git. Add `.env` to `.gitignore`.

### **Step 2: Get FREE Testnet Funds**

#### **2.1 Check Your Deployer Account**
```bash
# Check your account balance
yarn account

# Your deployer address will be shown
# Copy this address for getting testnet ETH
```

#### **2.2 Get FREE Sepolia ETH**
Visit these faucets and paste your deployer address:
- **Alchemy Faucet**: https://sepoliafaucet.com/
- **Chainlink Faucet**: https://faucets.chain.link/sepolia
- **QuickNode Faucet**: https://faucet.quicknode.com/ethereum/sepolia

💡 **Tip**: You need about 0.01 Sepolia ETH for deployment (completely free!)

### **Step 3: Deploy to Sepolia Testnet**

#### **3.1 Deploy Contracts**
```bash
# Deploy to Sepolia testnet
yarn deploy --network sepolia

# Expected output:
# 👋 MerchantService deployed to: 0x...
# 🏪 Liquid Token Address: 0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564
```

#### **3.2 Verify Contracts on Sepolia Etherscan**
```bash
# Verify MerchantService contract
yarn verify --network sepolia

# This will make your contract readable on Sepolia Etherscan
# View at: https://sepolia.etherscan.io/
```

#### **3.3 Save Contract Addresses**
Create `packages/nextjs/contracts/deployments.json`:
```json
{
  "sepolia": {
    "MerchantService": "0x_your_deployed_contract_address",
    "LiquidToken": "0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564"
  }
}
```

✅ **Checkpoint**: Your smart contracts are now live on Sepolia testnet!

---

## 🌐 **Phase 2: Frontend Deployment with Vercel (Testnet)**

### **Step 1: Prepare Frontend for Testnet**

#### **1.1 Update Environment Configuration**
Edit `packages/nextjs/.env.example` and create testnet environment:

```bash
# Testnet Environment Variables
NEXT_PUBLIC_SOONPAY_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=testnet

# SoonPay Integration (testnet/sandbox endpoints)
NEXT_PUBLIC_SOONPAY_API_URL=https://api-testnet.soonpay.com
NEXT_PUBLIC_SOONPAY_AUTH_URL=https://auth-testnet.soonpay.com
NEXT_PUBLIC_SOONPAY_CLIENT_ID=your_soonpay_testnet_client_id

# RPC Endpoints (Sepolia)
NEXT_PUBLIC_RPC_ENDPOINT=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key

# Contract Addresses (from Phase 1, Step 3.3)
NEXT_PUBLIC_MERCHANT_SERVICE_ADDRESS=0x_your_deployed_contract_address
NEXT_PUBLIC_LIQUID_TOKEN_TESTNET=0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564

# API Keys
NEXT_PUBLIC_COINGECKO_API_KEY=CG-fBP52GvjZkm2CZunNEQUCL2m

# Development Settings (keep true for testnet)
NEXT_PUBLIC_DEBUG_MODE=true
```

#### **1.2 Update Contract Configuration**
Edit `packages/nextjs/config/soonpay.config.ts`:

```typescript
// Update for testnet deployment
export const soonPayConfig: SoonPayConfig = {
  enabled: process.env.NEXT_PUBLIC_SOONPAY_ENABLED === 'true',
  apiEndpoint: process.env.NEXT_PUBLIC_SOONPAY_API_URL || 'https://api-testnet.soonpay.com',
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT || 'https://eth-sepolia.g.alchemy.com/v2/demo',
  authEndpoint: process.env.NEXT_PUBLIC_SOONPAY_AUTH_URL || 'https://auth-testnet.soonpay.com',
  environment: (process.env.NEXT_PUBLIC_ENVIRONMENT as 'local' | 'testnet' | 'mainnet') || 'testnet'
};
```

### **Step 2: Deploy to Vercel**

#### **2.1 Connect GitHub Repository**
1. Go to https://vercel.com/dashboard
2. Click "New Project"
3. Import your GitHub repository: `https://github.com/Liven-Allan/micro-payment`
4. Select the repository and click "Import"

#### **2.2 Configure Build Settings**
```bash
# Framework Preset: Next.js
# Root Directory: packages/nextjs
# Build Command: yarn build
# Output Directory: .next
# Install Command: yarn install
```

#### **2.3 Set Environment Variables in Vercel**
In Vercel dashboard → Project Settings → Environment Variables:

```bash
NEXT_PUBLIC_SOONPAY_ENABLED=true
NEXT_PUBLIC_ENVIRONMENT=testnet
NEXT_PUBLIC_SOONPAY_API_URL=https://api-testnet.soonpay.com
NEXT_PUBLIC_SOONPAY_AUTH_URL=https://auth-testnet.soonpay.com
NEXT_PUBLIC_SOONPAY_CLIENT_ID=your_soonpay_testnet_client_id
NEXT_PUBLIC_RPC_ENDPOINT=https://eth-sepolia.g.alchemy.com/v2/your_alchemy_key
NEXT_PUBLIC_MERCHANT_SERVICE_ADDRESS=0x_your_contract_address
NEXT_PUBLIC_LIQUID_TOKEN_TESTNET=0x11DFC652eb62c723ad8c2ae731FcEdE58aB07564
NEXT_PUBLIC_COINGECKO_API_KEY=CG-fBP52GvjZkm2CZunNEQUCL2m
NEXT_PUBLIC_DEBUG_MODE=true
```

💡 **Important**: Use your actual contract address from Phase 1, Step 3.3

#### **2.4 Deploy**
1. Click "Deploy" in Vercel
2. Wait for build to complete
3. Your app will be live at: `https://your-project-name.vercel.app`

---

## 🔐 **Phase 3: SoonPay Testnet Integration Setup**

### **Step 1: SoonPay Testnet/Sandbox Account**

#### **1.1 Register with SoonPay Testnet**
1. Visit SoonPay developer portal
2. Create developer account
3. Access testnet/sandbox environment
4. Get testnet API credentials (FREE)

#### **1.2 Configure SoonPay Testnet Integration**
```typescript
// Update packages/nextjs/hooks/useSoonPayAuth.ts
export const useSoonPayAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const login = async () => {
    try {
      // SoonPay Testnet OAuth flow
      const response = await fetch(`${soonPayConfig.authEndpoint}/oauth/authorize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SOONPAY_CLIENT_ID}`
        },
        body: JSON.stringify({
          client_id: process.env.NEXT_PUBLIC_SOONPAY_CLIENT_ID,
          redirect_uri: window.location.origin + '/auth/callback',
          scope: 'read write',
          environment: 'testnet' // Important for testnet
        })
      });

      const data = await response.json();
      setIsAuthenticated(true);
      setUser(data.user);
    } catch (error) {
      console.error('SoonPay testnet authentication failed:', error);
    }
  };

  return { isAuthenticated, user, login };
};
```

### **Step 2: Test SoonPay Testnet Integration**

#### **2.1 Test Authentication Flow**
1. Visit your deployed app: `https://your-project-name.vercel.app`
2. Test SoonPay testnet login
3. Verify user data retrieval
4. Test token balance checking with testnet LIQUID

#### **2.2 Test Payment Flow**
1. Register as merchant on your live app
2. Generate payment QR code
3. Test payment with SoonPay testnet wallet
4. Verify transaction recording on Sepolia
5. Check transaction on Sepolia Etherscan

✅ **Checkpoint**: Your app is now live with full SoonPay testnet integration!

---

## 🔍 **Phase 4: Testing & Monitoring (Testnet)**

### **Step 1: Comprehensive Testnet Testing**

#### **4.1 Functional Testing Checklist**
- [ ] Wallet connection works (MetaMask with Sepolia network)
- [ ] SoonPay testnet authentication works
- [ ] Merchant registration successful
- [ ] QR code generation works
- [ ] Payment processing works with testnet LIQUID
- [ ] Transaction history displays
- [ ] Balance updates correctly
- [ ] Error handling works
- [ ] Sepolia Etherscan shows transactions

#### **4.2 Get Testnet LIQUID Tokens**
Since you're using the real LIQUID token on testnet:
1. Visit LIQUID token faucet (if available)
2. Or contact SoonPay for testnet LIQUID tokens
3. Test with small amounts first

#### **4.3 Performance Testing**
```bash
# Test build performance
cd packages/nextjs
yarn build
yarn start

# Check bundle size
npx @next/bundle-analyzer
```

### **Step 2: Monitoring Setup**

#### **4.2 Vercel Analytics (FREE)**
1. Enable Vercel Analytics in dashboard
2. Monitor page load times
3. Track user interactions
4. View real-time usage data

#### **4.3 Testnet Transaction Monitoring**
- Monitor transactions on Sepolia Etherscan
- Track gas usage and costs
- Verify contract interactions
- Check event emissions

---

## 🚀 **Phase 5: Go Live on Testnet**

### **Step 1: Final Preparations**

#### **5.1 Custom Domain Setup (Optional)**
1. Purchase custom domain (e.g., `liquidquick-testnet.com`)
2. Configure DNS in Vercel
3. Set up SSL certificate (automatic)
4. Perfect for demos and presentations!

#### **5.2 SEO Optimization**
```typescript
// Update packages/nextjs/app/layout.tsx
export const metadata = {
  title: 'LiquidQuick - Campus Micro Payments (Testnet)',
  description: 'Blockchain-powered payment system for students and merchants - Testnet Demo',
  keywords: 'blockchain, payments, campus, students, merchants, LIQUID, testnet, demo',
  openGraph: {
    title: 'LiquidQuick - Campus Micro Payments (Testnet)',
    description: 'Fast, secure blockchain payments for campus commerce - Live Demo',
    url: 'https://your-domain.com',
    siteName: 'LiquidQuick Testnet',
  }
};
```

### **Step 2: Testnet Launch**

#### **5.1 Soft Launch**
1. Deploy to Vercel with testnet configuration
2. Test with friends and colleagues
3. Monitor for issues
4. Collect feedback
5. Share Sepolia Etherscan links to show real transactions

#### **5.2 Demo Launch**
1. Create demo accounts (merchant & student)
2. Prepare demo script
3. Share live demo link
4. Use for presentations and pitches
5. Showcase real blockchain transactions

### **Step 3: Showcase Your Live DApp**

#### **5.3 Demo Features to Highlight**
- ✅ **Live on Blockchain**: Real transactions on Sepolia
- ✅ **Professional UI**: Deployed on Vercel
- ✅ **SoonPay Integration**: Working authentication
- ✅ **QR Code Payments**: Scan and pay functionality
- ✅ **Transaction History**: Real-time updates
- ✅ **Verified Contracts**: Viewable on Etherscan

#### **5.4 Perfect for:**
- Investor presentations
- University project demos
- Portfolio showcases
- Technical interviews
- Hackathon submissions
- Grant applications

---

## 📊 **Post-Launch Monitoring (Testnet)**

### **Key Metrics to Track**
- Daily/Monthly Active Users (via Vercel Analytics)
- Transaction volume on Sepolia
- Gas costs (very low on testnet)
- Error rates
- User feedback
- Demo engagement

### **Maintenance Tasks**
- Monitor contract interactions on Sepolia
- Update dependencies
- Security patches
- Feature updates based on feedback
- Prepare for mainnet migration (when ready)

### **Benefits of Testnet Deployment**
- ✅ **Zero Cost**: No real ETH required
- ✅ **Full Functionality**: Complete DApp experience
- ✅ **Real Blockchain**: Actual transactions on Sepolia
- ✅ **Professional Demo**: Live, working application
- ✅ **Risk-Free Testing**: Perfect for experimentation
- ✅ **Easy Iteration**: Quick updates and testing

---

## 🆘 **Troubleshooting**

### **Common Issues**

#### **Contract Deployment Fails**
```bash
# Check account balance
yarn account

# Get more Sepolia ETH from faucets
# Retry deployment
yarn deploy --network sepolia
```

#### **Vercel Build Fails**
```bash
# Check build locally
cd packages/nextjs
yarn build

# Common fixes:
# 1. Update Node.js version in Vercel settings to 20.x
# 2. Check environment variables are set correctly
# 3. Verify all dependencies are installed
# 4. Check for TypeScript errors
```

#### **SoonPay Integration Issues**
1. Verify testnet API credentials
2. Check CORS settings for your domain
3. Validate redirect URIs match your Vercel URL
4. Test in SoonPay sandbox environment first
5. Check network is set to Sepolia in MetaMask

#### **MetaMask Network Issues**
Add Sepolia network to MetaMask:
- Network Name: Sepolia Test Network
- RPC URL: https://sepolia.infura.io/v3/YOUR_KEY
- Chain ID: 11155111
- Currency Symbol: ETH
- Block Explorer: https://sepolia.etherscan.io

---

## 🎯 **Success Checklist**

- [ ] Smart contracts deployed and verified on Sepolia
- [ ] Frontend deployed on Vercel
- [ ] SoonPay testnet integration working
- [ ] All tests passing
- [ ] Monitoring setup (Vercel Analytics)
- [ ] Documentation updated
- [ ] Demo script prepared
- [ ] Testnet LIQUID tokens acquired
- [ ] MetaMask configured for Sepolia
- [ ] Live demo ready for presentations

---

## 💰 **Total Cost: $0 (FREE!)**

- ✅ **Sepolia ETH**: Free from faucets
- ✅ **Vercel Hosting**: Free tier
- ✅ **Alchemy RPC**: Free tier
- ✅ **Etherscan API**: Free tier
- ✅ **SoonPay Testnet**: Free sandbox
- ✅ **Domain** (optional): ~$10-15/year

---

## 📞 **Support Resources**

- **Vercel Documentation**: https://vercel.com/docs
- **Hardhat Documentation**: https://hardhat.org/docs
- **Sepolia Faucets**: https://sepoliafaucet.com/
- **Sepolia Etherscan**: https://sepolia.etherscan.io/
- **SoonPay Developer Docs**: [SoonPay Developer Portal]
- **Ethereum Testnet Guide**: https://ethereum.org/developers/docs/networks/

---

**🎉 Congratulations! Your Micro Payments DApp is now LIVE on testnet!**

You now have:
- ✅ A fully functional DApp running on real blockchain
- ✅ Professional deployment on Vercel
- ✅ Working SoonPay integration
- ✅ Perfect demo for presentations
- ✅ Zero cost implementation
- ✅ Ready for mainnet migration when needed

**Next Steps:**
- Share your live demo with stakeholders
- Collect user feedback
- Iterate and improve
- Plan mainnet deployment when ready
- Use for portfolio, presentations, and applications!