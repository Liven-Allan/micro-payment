"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { 
  WalletIcon, 
  QrCodeIcon, 
  CheckCircleIcon,
  BuildingStorefrontIcon,
  AcademicCapIcon,
  ChartBarIcon,
  ClockIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  DevicePhoneMobileIcon
} from "@heroicons/react/24/outline";
import {
  WalletIcon as WalletIconSolid,
  QrCodeIcon as QrCodeIconSolid,
  CheckCircleIcon as CheckCircleIconSolid,
  BuildingStorefrontIcon as BuildingStorefrontIconSolid,
  AcademicCapIcon as AcademicCapIconSolid
} from "@heroicons/react/24/solid";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      {/* Hero Section */}
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10">
        <div className="container mx-auto px-4 py-16">
          {/* Main Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="text-base-content">Pay Seamlessly with </span>
              <span className="text-primary">Micro Payments</span>
            </h1>
            <p className="text-xl md:text-2xl text-base-content opacity-70 mb-8 max-w-4xl mx-auto">
              The blockchain-powered payment system connecting students and merchants. 
              Fast, secure, and transparent transactions.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link 
                href="/merchant" 
                className="btn btn-primary btn-lg text-lg px-8 py-4 rounded-full"
              >
                <BuildingStorefrontIcon className="w-6 h-6 mr-2" />
                I'm a Merchant
              </Link>
              <Link 
                href="/student" 
                className="btn btn-secondary btn-lg text-lg px-8 py-4 rounded-full"
              >
                <AcademicCapIcon className="w-6 h-6 mr-2" />
                I'm a Student
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">1000+</div>
                <div className="text-base-content opacity-60">Transactions</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">50+</div>
                <div className="text-base-content opacity-60">Merchants</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600">500+</div>
                <div className="text-base-content opacity-60">Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-base-200 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-base-content">How It </span>
              <span className="text-primary">Works</span>
            </h2>
            <p className="text-xl text-base-content opacity-70">
              Three simple steps to seamless blockchain payments.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="text-center">
              <div className="bg-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-300 shadow-lg">
                <WalletIconSolid className="w-12 h-12 text-blue-600" />
              </div>
              <div className="bg-blue-600 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                01
              </div>
              <h3 className="text-2xl font-bold text-base-content mb-4">Connect Wallet</h3>
              <p className="text-base-content opacity-70">
                Link your Ethereum wallet to get started with LIQUID tokens.
              </p>
            </div>

            {/* Step 2 */}
            <div className="text-center">
              <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-300 shadow-lg">
                <QrCodeIconSolid className="w-12 h-12 text-green-600" />
              </div>
              <div className="bg-green-600 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                02
              </div>
              <h3 className="text-2xl font-bold text-base-content mb-4">Scan & Pay</h3>
              <p className="text-base-content opacity-70">
                Merchants display QR codes. Students scan to make instant payments.
              </p>
            </div>

            {/* Step 3 */}
            <div className="text-center">
              <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-purple-300 shadow-lg">
                <CheckCircleIconSolid className="w-12 h-12 text-purple-600" />
              </div>
              <div className="bg-purple-600 text-white text-sm font-bold px-3 py-1 rounded-full inline-block mb-4">
                03
              </div>
              <h3 className="text-2xl font-bold text-base-content mb-4">Done!</h3>
              <p className="text-base-content opacity-70">
                Transactions are confirmed on-chain. Fast, secure, transparent.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Choose Your Path Section */}
      <div className="bg-base-100 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-base-content">
              Choose Your Path
            </h2>
            <p className="text-xl text-base-content opacity-70">
              Whether you're accepting payments or making them, we've got you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* For Merchants */}
            <div className="bg-base-200 rounded-3xl p-8 border border-base-300">
              <div className="text-center mb-8">
                <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-blue-300 shadow-lg">
                  <BuildingStorefrontIconSolid className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-3xl font-bold text-blue-600 mb-4">For Merchants</h3>
                <p className="text-base-content opacity-70">
                  Accept LIQUID payments instantly with your unique QR code. 
                  Track sales and manage your business effortlessly.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <QrCodeIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-base-content">Generate payment QR codes</span>
                </div>
                <div className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-base-content">Real-time sales dashboard</span>
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-base-content">Instant settlements</span>
                </div>
              </div>

              <Link 
                href="/merchant" 
                className="btn bg-blue-600 hover:bg-blue-700 text-white w-full btn-lg border-0"
              >
                Get Started as Merchant
              </Link>
            </div>

            {/* For Students */}
            <div className="bg-base-200 rounded-3xl p-8 border border-base-300">
              <div className="text-center mb-8">
                <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-green-300 shadow-lg">
                  <AcademicCapIconSolid className="w-10 h-10 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-green-600 mb-4">For Students</h3>
                <p className="text-base-content opacity-70">
                  Scan, pay, and go. Manage your LIQUID balance and 
                  track your spending all in one place.
                </p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <DevicePhoneMobileIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-base-content">Scan to pay merchants</span>
                </div>
                <div className="flex items-center">
                  <ChartBarIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-base-content">Transaction history</span>
                </div>
                <div className="flex items-center">
                  <ShieldCheckIcon className="w-5 h-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-base-content">Instant payments</span>
                </div>
              </div>

              <Link 
                href="/student" 
                className="btn bg-green-600 hover:bg-green-700 text-white w-full btn-lg border-0"
              >
                Get Started as Student
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-base-300 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary text-primary-content w-10 h-10 rounded-lg flex items-center justify-center mr-3">
              <span className="font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-base-content">Micro Payments</span>
          </div>
          <p className="text-base-content opacity-60">
            Built on Ethereum • Powered by blockchain
          </p>
        </div>
      </footer>
    </>
  );
};

export default Home;
