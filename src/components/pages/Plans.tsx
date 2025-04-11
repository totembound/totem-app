import { useNavigate } from "react-router-dom";
import { Key, Award, Zap, Check, Shield, ArrowRight } from "lucide-react";

const Plans = () => {
  const navigate = useNavigate();

  const handleGetStarted = (plan: any) => {
    console.log(`Starting with ${plan} plan`);
    localStorage.setItem(
      "signupState",
      JSON.stringify({
        step: "connect",
        plan,
      })
    );
    navigate("/signup");
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 bg-white dark:bg-gray-900 rounded-lg">
      <div className="max-w-7xl mx-auto">
        {/* Header section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Select the plan that best fits your gaming style. Each tier offers
            different transaction capabilities to enhance your TotemBound
            experience.
          </p>
        </div>

        {/* Plans section */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Free Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2 mt-6">
                <Key className="h-6 w-6 text-green-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Standard Tier
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Entry-level access for casual players
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /month
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                No credit card required
              </div>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Access to all TotemBound games
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Collect unique spirit totems
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Train and evolve companions
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Sponsored transactions
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    50 transactions per day
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    5 transactions per minute
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Standard transaction priority
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Community support
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => handleGetStarted("standard")}
                className="w-full py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
              >
                Get Started
              </button>
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border-2 border-purple-500 dark:border-purple-400 flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 text-center">
              <span className="bg-purple-600 text-white px-4 py-1 rounded-b-lg text-sm font-medium inline-block">
                Recommended
              </span>
            </div>

            <div className="p-6 border-b border-gray-200 dark:border-gray-700 mt-6">
              <div className="flex items-center mb-2">
                <Award className="h-6 w-6 text-purple-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Premium Tier
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Enhanced service for active players
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $10
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /month
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Cancel anytime
              </div>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Everything in Standard Tier
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Enhanced transactions
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    1000 transactions per day
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    30 transactions per minute
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Priority transaction processing
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Exclusive game features
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Monthly bonus credits
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-purple-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Premium support
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20">
              <button
                onClick={() => handleGetStarted("premium")}
                className="w-full py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors flex items-center justify-center"
              >
                <span>Go Premium</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Advanced Plan */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center mb-2 mt-6">
                <Zap className="h-6 w-6 text-blue-500 mr-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Advanced Tier
                </h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Self-managed option for advanced users
              </p>
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-gray-900 dark:text-white">
                  $0
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1">
                  /month
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Pay your own network fees
              </div>
            </div>
            <div className="p-6 flex-grow">
              <ul className="space-y-3">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Access to all TotemBound games
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Collect unique spirit totems
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Train and evolve companions
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Standard network fees apply
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    No transaction limits
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Direct transaction management
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Support for advanced wallet features
                  </span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-blue-500 flex-shrink-0 mr-2" />
                  <span className="text-gray-600 dark:text-gray-300">
                    Advanced user experience
                  </span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-700/50">
              <button
                onClick={() => handleGetStarted("advanced")}
                className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                Switch to Advanced
              </button>
            </div>
          </div>
        </div>

        {/* FAQ section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                What is the difference between Standard and Premium tiers?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The Standard tier offers basic access with limited transaction
                speeds and volume. Premium unlocks higher transaction limits
                (1000 per day vs 50), priority processing, monthly bonus
                credits, and exclusive game features that enhance your
                TotemBound experience.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                What are sponsored transactions?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Sponsored transactions allow you to interact with TotemBound
                without paying network fees for each action. We cover these fees
                for you, making gameplay smoother and more affordable. Standard
                tier users get 50 sponsored transactions per day, while Premium
                users get 1000.
              </p>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                For Standard tier users, these sponsored transactions are
                supported by our ecosystem, which may include occasional
                non-intrusive advertisements or promotional content. Premium
                users enjoy an ad-free experience with higher transaction limits
                as part of their subscription benefits.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                Can I switch between plans?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Yes! You can upgrade or downgrade your plan at any time. When
                upgrading to Premium, you'll be billed for the new plan
                immediately. When downgrading, you'll retain Premium benefits
                until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                How does the Advanced tier work?
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                The Advanced tier is for users who prefer to manage their own
                transaction fees. You'll pay network fees directly from your
                wallet for each transaction, but you'll have unlimited
                transactions and complete control over your transaction
                settings.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Security section */}
        <div className="mt-16 text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full">
              <Shield className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Secure Payments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            All payments are processed securely through Stripe. <br/>
            Your payment information is encrypted and never stored on our servers.
          </p>

          <div className="flex justify-center mt-6 space-x-6">
            <img src="/images/stripe.png" alt="Stripe" className="h-8" />
            <img
              src="/images/visa-mastercard-amex.png"
              alt="Credit Cards"
              className="h-8"
            />
            <img
              src="/images/gpay-apay.png"
              alt="Google Pay / Apple Pay"
              className="h-8"
            />
          </div>
        </div>
      </div>

      {/* CTA Banner */}
      <div className="bg-purple-700 dark:bg-purple-900 rounded-lg mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center md:text-left">
          <div className="md:flex md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">
                Ready to start your journey?
              </h2>
              <p className="text-purple-200">
                Join thousands of players in the mystical world of TotemBound
                today.
              </p>
            </div>
            <div className="mt-6 md:mt-0">
              <button
                onClick={() => handleGetStarted("standard")}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-purple-700 bg-white hover:bg-purple-50"
              >
                Get Started For Free
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Plans;
