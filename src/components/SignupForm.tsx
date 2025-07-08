import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { ComingSoon } from './ComingSoon';
import { Feature } from './Feature';
import { useTransactionService } from '../hooks/useTransactionService';
import { ArrowRight, ArrowLeft, CheckCircle, Shield, Check, Info, Wallet, Key, Award, Zap, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Turnstile } from '@marsidev/react-turnstile';
import { useTheme } from '../contexts/ThemeContext';

type OnboardingStep = 'welcome' | 'connect' | 'plans' | 'email' | 'key-requested' | 'enter-api-key' | 'advanced' | 'processing' | 'success';

export const SignupForm: React.FC = () => {
    const { isSignedUp, checkSignupStatus, isConnected, connect, disconnect, address, comingSoon, isGaslessEnabled, setGaslessEnabled, setGaslessApiKey } = useUser();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
    const [selectedPlan, setSelectedPlan] = useState<'standard' | 'premium' | 'advanced'>('standard');
    const [email, setEmail] = useState('');
    const normalizedAddress = (address as string || '').toLowerCase();
    const [apiKey, setApiKey] = useState('');
    const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
    const [turnstileToken, setTurnstileToken] = useState<string>('');
    const [showTurnstileError, setShowTurnstileError] = useState(false);
    const API_GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'https://api.totembound.com/v1';
    const { theme } = useTheme();
    
    const txService = useTransactionService({
        gaslessEnabled: isGaslessEnabled,
        waitForConfirmation: true
    });

    // Effect to manage steps based on wallet connection
    useEffect(() => {
        if (isConnected && currentStep === 'connect') {
            setCurrentStep('plans');
        }
        if (!isConnected && (currentStep !== 'welcome' && currentStep !== 'connect')) {
            setCurrentStep('welcome');
        }
    }, [isConnected, currentStep]);

    // Check for saved state on component mount
    useEffect(() => {
        if (isSignedUp) return; // Skip if already signed up
        
        // Check localStorage for saved signup state
        const savedState = localStorage.getItem('signupState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                if (state.step) {
                    if (state.step === 'connect' && isConnected) {
                        state.step = 'plans';
                    }
                    setCurrentStep(state.step);
                    if (state.plan) setSelectedPlan(state.plan);
                    if (state.email) setEmail(state.email);
                }
            }
            catch (e) {
                console.error('Error parsing saved signup state:', e);
                localStorage.removeItem('signupState'); // Remove invalid state
            }
        }
    }, [isConnected]);
    
    // Function to handle API key requests
    const requestApiKey = async () => {
        setLoading(true);
        setError('');
        setShowTurnstileError(false);
        
        // Validate turnstile token for Standard tier only
        if (selectedPlan === 'standard' && !turnstileToken) {
            setShowTurnstileError(true);
            setError('Please complete the security verification');
            setLoading(false);
            return;
        }
        
        try {
            // Make the API request based on selected plan
            if (selectedPlan === 'premium') {
                // For Premium Plan: Call checkout endpoint
                const response = await fetch(`${API_GATEWAY_URL}/stripe/checkout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    walletAddress: address,
                    tier: 'premium'
                })
                });
        
                if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create checkout');
                }
        
                const { sessionUrl } = await response.json();
                
                // Save state before redirecting
                localStorage.setItem('signupState', JSON.stringify({
                step: 'enter-api-key', 
                plan: selectedPlan,
                email
                }));
                
                // Redirect to Stripe
                window.location.href = sessionUrl;
                return; // Exit early since we're redirecting
            }
            else {
                // For Standard Plan: Call signup endpoint
                const response = await fetch(`${API_GATEWAY_URL}/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        walletAddress: address,
                        turnstileToken
                    })
                });
        
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to request API key');
                }
                
                // Save state to localStorage
                localStorage.setItem('signupState', JSON.stringify({
                    step: 'enter-api-key', 
                    plan: selectedPlan,
                    email
                }));
                
                // Show success and move to confirmation step
                setCurrentStep('key-requested');
            }
        }
        catch (err: any) {
            console.error('Error:', err);
            setError('Unable to connect to the API service. Please try again later or contact support if the problem persists.');
        } finally {
            setLoading(false);
        }
    };

    // Clear saved state when signup is successful
    const handleSignupSuccess = () => {
        localStorage.removeItem('signupState');
        setCurrentStep('success');
    };
    
    const handleSignupWithApiKey = async () => {
        setLoading(true);
        setError('');
        
        try {
            // First, store the API key in the user context
            setGaslessEnabled(true);
            setGaslessApiKey(apiKey);

            // Then complete the signup process with the relay service
            if (!txService) throw new Error('Transaction service not initialized');
            txService.setGaslessEnabled(true, apiKey);

            setCurrentStep('processing');
            const result = await txService.signup();
            console.log('Signup transaction complete:', result);
            
            // Add a small delay before checking status
            await new Promise(resolve => setTimeout(resolve, 1500));
            await checkSignupStatus(); // Update global state
            
            // Clear saved state on success
            handleSignupSuccess();
        }
        catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message?.includes('user rejected') 
                    ? 'You cancelled the transaction. Please try again.' 
                    : err.message || 'An unexpected error occurred during signup.');
            setCurrentStep('enter-api-key'); // Go back to API key entry on error
        }
        finally {
            setLoading(false);
        }
    };
    
    const handleSignupDirect = async () => {
        setLoading(true);
        setError('');
        setCurrentStep('processing');

        try {
            // Advanced uses regular web3 transaction
            if (!txService) throw new Error('Transaction service not initialized');

            const result = await txService.signup();
            console.log('Signup transaction complete:', result);
            
            // Add a small delay before checking status
            await new Promise(resolve => setTimeout(resolve, 1500));
            await checkSignupStatus(); // Update global state

            // Clear saved state on success
            handleSignupSuccess();
        }
        catch (err: any) {
            console.error('Signup error:', err);
            setError(err.message?.includes('user rejected') 
                    ? 'You cancelled the transaction. Please try again.' 
                    : err.message || 'An unexpected error occurred during signup.'
            );
            setCurrentStep(selectedPlan === 'advanced' ? 'advanced' : 'email');
        }
        finally {
            setLoading(false);
        }
    };
    
    const handleConnect = async () => {
        setCurrentStep('connect');
        await connect();
    };

    const handleDisconnect = () => {
        disconnect();
        setCurrentStep('welcome');
    };

    // Render progress indicator
    const renderProgressIndicator = () => {
        // Only include steps that should show in the indicator
        const indicatorSteps = [
            'connect', 
            'plans', 
            selectedPlan === 'advanced' ? 'advanced' : 'email', 
            selectedPlan === 'advanced' ? null : 'enter-api-key'
        ].filter(Boolean);

        // Find the current position in the indicator steps
        const currentStepIndex = indicatorSteps.indexOf(currentStep);
        
        return (
            <div className="absolute top-4 left-0 right-0 flex justify-center">
                <div className="bg-gray-200 dark:bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-2">
                    {indicatorSteps.map((_, index) => (
                        <span 
                            key={index}
                            className={`h-2.5 w-2.5 rounded-full transition-colors ${
                                index <= currentStepIndex 
                                    ? 'bg-purple-600' 
                                    : 'bg-gray-400 dark:bg-white/40'
                            }`}
                        />
                    ))}
                </div>
            </div>
        );
    };

    // If already signed up, show success message
    if (isSignedUp) {
        return (
            <div className="bg-gray-50 dark:bg-gray-900 p-6 md:p-8 rounded-lg max-w-[95%] md:max-w-2xl mx-auto 
                shadow-lg border border-gray-100 dark:border-gray-700 relative text-center">
                <div className="w-20 h-20 mx-auto mb-6 text-green-500 dark:text-green-400">
                    <CheckCircle className="w-full h-full" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                    Welcome to TotemBound!
                </h2>
                <p className="mb-6 text-gray-700 dark:text-gray-300">
                    Your account has been created successfully
                </p>
                
                <div className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 
                    rounded-lg p-4 mb-6 text-center">
                    <p className="text-green-800 dark:text-green-200">
                        We've added 2000 TOTEM to your account to help you start your journey!
                    </p>
                </div>
                
                <button
                    onClick={() => window.location.href = '/'}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                        rounded-lg w-full text-lg transition-all">
                    Enter TotemBound
                </button>
                
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                    Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                </p>
            </div>
        );
    }

    // Render step content based on current step
    const renderStepContent = () => {
        switch (currentStep) {
            case 'welcome':
                return (
                    <>
                        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center text-gray-900 dark:text-white">
                            Welcome to TotemBound! ✨
                        </h1>
                        
                        {comingSoon ? <ComingSoon /> : null}

                        <div className="bg-gray-200 dark:bg-gray-800 p-4 md:p-6 rounded-lg mb-8">
                            <h2 className="text-xl md:text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                                What are Totems? 🦉
                            </h2>
                            <p className="mb-6 text-gray-700 dark:text-gray-300">
                                Totems are your unique, evolving companions, each representing a powerful animal spirit. 
                                Each totem grows stronger through your guidance and training.
                            </p>

                            <div className="space-y-3 md:space-y-4">
                                <Feature icon="🦉" text="Collect unique companions with real power" />
                                <Feature icon="⚡" text="Train and evolve your mystical animal spirits" />
                                <Feature icon="💎" text="Trade and grow your collection of rare totems" />
                                <Feature icon="🌿" text="Unlock new abilities and rewards" />
                                <Feature icon="🏆" text="Compete in challenges and events" />
                                <Feature icon="🪙" text="Stake Wise Elder totems to earn rewards" />
                            </div>

                            <p className="mt-6 text-gray-700 dark:text-gray-300">
                                As a chosen Keeper, you'll harness primal energies, unlock hidden abilities, 
                                and even ascend your totem companions to their ultimate Wise Elder forms. 
                            </p>
                            <p className="mt-4 mb-4 text-gray-700 dark:text-gray-300">
                                The path to mastery begins with a single connection. Start your spiritual journey in TotemBound today!
                            </p>
                            
                            <div className="text-lg md:text-xl text-center mt-6">
                                🐻🐺🦫🐢🦉<span className="raven-emoji">🦅</span>🦢🐍🦅🦌🦦🐦
                            </div>
                        </div>

                        <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-lg mb-8 text-center">
                            <p className="text-lg text-purple-800 dark:text-purple-200">
                                ✨ Future updates include Totem combinations, rarity upgrades, new accessories, habitats and epic challenges! ✨
                            </p>
                        </div>
                        
                        <button
                            onClick={() => setCurrentStep('connect')}
                            disabled={comingSoon}
                            className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                                rounded-lg w-full text-lg transition-all focus:ring-2 focus:ring-purple-500 
                                focus:ring-offset-2 dark:focus:ring-offset-gray-800 flex items-center justify-center
                                ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <span>Begin Your Journey</span>
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </button>
                    </>
                );
                
            case 'connect':
                return (
                    <>
                        {renderProgressIndicator()}
                        
                        <h2 className="text-2xl font-bold mb-4 text-center text-gray-900 dark:text-white mt-6">
                            Set Up Your Account
                        </h2>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex items-start">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                                    <Shield className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Secure Account Setup</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        TotemBound uses secure digital wallet technology to protect your account and items.
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                                    <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Connect Your Wallet</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        We use MetaMask for secure authentication (no password needed!).
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-start">
                                <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg mr-3">
                                    <CheckCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Starter Gift</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        New players receive 2000 TOTEM game credits to get started!
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                disabled={comingSoon}
                                onClick={handleConnect}
                                className={`bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                                    rounded-lg w-full text-lg transition-all
                                    ${comingSoon ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                {comingSoon ? 'Coming Soon!' : 'Connect Wallet'}
                            </button>
                            <button
                                onClick={() => window.open('https://metamask.io/download/', '_blank')}
                                className="bg-transparent border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 
                                    py-2 px-4 rounded-lg w-full text-sm transition-all hover:bg-gray-100 dark:hover:bg-gray-800">
                                Need help setting up a wallet?
                            </button>
                        </div>
                        
                        <button
                            onClick={() => setCurrentStep('welcome')}
                            className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center hover:underline">
                            <ArrowLeft className="mr-1 h-4 w-4" />
                            Back to welcome
                        </button>


                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                                Frequently Asked Questions
                            </h3>

                            <div className="space-y-3">
                                {/* FAQ Item 1 */}
                                <div className="border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setExpandedFaq(expandedFaq === 'wallet' ? null : 'wallet')}
                                    className="flex justify-between items-center w-full px-4 py-3 text-left bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">Why do I need to connect a wallet?</span>
                                    <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === 'wallet' ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedFaq === 'wallet' && (
                                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-700 dark:text-gray-300 border-t border-blue-100 dark:border-blue-800">
                                    <p>Wallets provide a secure way to authenticate without passwords. You own your game assets directly, and we never store or have access to your credentials. This means better security for your account and true ownership of your in-game items.</p>
                                    </div>
                                )}
                                </div>

                                {/* FAQ Item 2 */}
                                <div className="border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setExpandedFaq(expandedFaq === 'security' ? null : 'security')}
                                    className="flex justify-between items-center w-full px-4 py-3 text-left bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">Is my wallet and data secure?</span>
                                    <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === 'security' ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedFaq === 'security' && (
                                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-700 dark:text-gray-300 border-t border-blue-100 dark:border-blue-800">
                                    <p><strong>Yes!</strong> We use industry-standard security practices. Your wallet is non-custodial, meaning you always maintain full control of your assets and private keys - we never have access to them.</p>
                                    <p className="mt-2">Our wallet connection only requests the minimum permissions needed to verify your identity and process specific actions you initiate. This is significantly more secure than traditional username/password systems where services store your credentials on their servers.</p>
                                    </div>
                                )}
                                </div>

                                {/* FAQ Item 3 */}
                                <div className="border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setExpandedFaq(expandedFaq === 'fees' ? null : 'fees')}
                                    className="flex justify-between items-center w-full px-4 py-3 text-left bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">Do I need to pay cryptocurrency fees?</span>
                                    <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === 'fees' ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedFaq === 'fees' && (
                                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-700 dark:text-gray-300 border-t border-blue-100 dark:border-blue-800">
                                    <p><strong>No.</strong> With our Standard and Premium plans, you won't need to use cryptocurrency or pay gas fees. All transaction costs are handled for you!</p>
                                    </div>
                                )}
                                </div>

                                {/* FAQ Item 4 */}
                                <div className="border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setExpandedFaq(expandedFaq === 'blockchain' ? null : 'blockchain')}
                                    className="flex justify-between items-center w-full px-4 py-3 text-left bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">Why does TotemBound use blockchain technology?</span>
                                    <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === 'blockchain' ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedFaq === 'blockchain' && (
                                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-700 dark:text-gray-300 border-t border-blue-100 dark:border-blue-800">
                                    <p>Blockchain allows us to reduce platform overhead costs, provide true item ownership to players, and ensure the longevity of your game assets. You're not just "renting" your game items - you truly own them. This technology enables us to build a more player-centered gaming experience with lower fees.</p>
                                    </div>
                                )}
                                </div>

                                {/* FAQ Item 5 */}
                                <div className="border border-blue-100 dark:border-blue-800 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setExpandedFaq(expandedFaq === 'technical' ? null : 'technical')}
                                    className="flex justify-between items-center w-full px-4 py-3 text-left bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                >
                                    <span className="font-medium text-gray-900 dark:text-white text-sm">Do I need technical knowledge?</span>
                                    <ChevronDown className={`h-5 w-5 text-gray-500 dark:text-gray-400 transition-transform ${expandedFaq === 'technical' ? 'rotate-180' : ''}`} />
                                </button>
                                
                                {expandedFaq === 'technical' && (
                                    <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/10 text-sm text-gray-700 dark:text-gray-300 border-t border-blue-100 dark:border-blue-800">
                                    <p><strong>Not at all!</strong> We've designed the experience to be as simple as possible. You just play the game and enjoy the benefits, without needing to understand blockchain details.</p>
                                    <p className="mt-2">You'll need to approve signature requests, which are simple confirmations that don't cost anything. With Standard and Premium plans, transaction fees are covered for you.</p>
                                    <p className="mt-2">For certain store purchases or advanced features, you may see transaction requests that require confirmation. Advanced Tier users will see transaction requests for all actions, as they're managing their own fees.</p>
                                    </div>
                                )}
                                </div>
                            </div>
                        </div>
                    </>
                );
                
            case 'plans':
                return (
                    <>
                        {renderProgressIndicator()}
                        
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white mt-6">
                            Choose Your Play Style
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            Select how you want to handle transactions in TotemBound
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <div 
                                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md
                                    ${selectedPlan === 'standard' 
                                        ? 'border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20' 
                                        : 'border-gray-200 dark:border-gray-700'}`}
                                onClick={() => setSelectedPlan('standard')}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                                        <Key className="h-4 w-4 text-green-500 dark:text-green-400 mr-2" />
                                        Standard Tier
                                    </h3>
                                    <span className="text-sm font-medium rounded-full px-2 py-0.5 bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                                        Free
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                    Entry-level access for casual players
                                </p>
                                <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400 mr-1.5" />
                                        <span>Sponsored transactions</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400 mr-1.5" />
                                        <span>50 transactions per day</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-green-500 dark:text-green-400 mr-1.5" />
                                        <span>Standard transaction priority</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div 
                                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md
                                    ${selectedPlan === 'premium' 
                                        ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/20' 
                                        : 'border-gray-200 dark:border-gray-700'}`}
                                onClick={() => setSelectedPlan('premium')}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                                        <Award className="h-4 w-4 text-purple-500 dark:text-purple-400 mr-2" />
                                        Premium Tier
                                    </h3>
                                    <span className="text-sm font-medium rounded-full px-2 py-0.5 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                                        $10/month
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                    Enhanced transaction service for active players
                                </p>
                                <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 mr-1.5" />
                                        <span>Enhanced transactions</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 mr-1.5" />
                                        <span>1000 transactions per day</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 mr-1.5" />
                                        <span>Priority transaction processing</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 mr-1.5" />
                                        <span>Monthly bonus credits</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-purple-500 dark:text-purple-400 mr-1.5" />
                                        <span>Premium support</span>
                                    </li>
                                </ul>
                            </div>
                            
                            <div 
                                className={`border rounded-lg p-4 transition-all cursor-pointer hover:shadow-md
                                    ${selectedPlan === 'advanced' 
                                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                                        : 'border-gray-200 dark:border-gray-700'}`}
                                onClick={() => setSelectedPlan('advanced')}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
                                        <Zap className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                                        Advanced Tier
                                    </h3>
                                    <span className="text-sm font-medium rounded-full px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                        Self-managed
                                    </span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                                    Self-managed option for advanced users
                                </p>
                                <ul className="text-sm text-gray-500 dark:text-gray-500 space-y-1">
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5" />
                                        <span>Standard network fees apply</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5" />
                                        <span>No transaction limits</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5" />
                                        <span>Direct transaction management</span>
                                    </li>
                                    <li className="flex items-center">
                                        <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5" />
                                        <span>Pay your own network fees directly</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        
                        { selectedPlan !== 'advanced' && 
                            <button
                                onClick={() => setCurrentStep('enter-api-key')}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg mb-3"
                            >
                                I already have my API key!
                            </button>
                        }

                        <p className="text-sm text-gray-700 dark:text-gray-300 pb-4 text-center">
                            By continuing, you are acknowledging and accepting our &nbsp;
                            <Link 
                                to="/terms"
                                className="underline hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                            >
                                Terms of Use
                            </Link>
                            &nbsp; and &nbsp;
                            <Link 
                                to="/privacy"
                                className="underline hover:text-gray-900 dark:hover:text-gray-300 transition-colors"
                            >
                                Privacy Policy
                            </Link>.
                        </p>

                        <div className="flex space-x-3">
                            <button
                                onClick={() => {
                                    disconnect();
                                    setCurrentStep('connect');
                                }}
                                className="flex-1 py-2 bg-transparent border border-gray-300 dark:border-gray-700 
                                    text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                Back
                            </button>
                            <button
                                onClick={() => setCurrentStep(selectedPlan === 'advanced' ? 'advanced' : 'email')}
                                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg">
                                Continue
                            </button>
                        </div>
                        
                        
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                        </p>
                    </>
                );

            case 'email':
                return (
                    <>
                        {renderProgressIndicator()}
                        
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white mt-6">
                            Request Your API Key
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            We'll send you an API key to enable {selectedPlan === 'premium' ? 'premium' : 'sponsored'} transactions
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Email Address
                                </label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="your@email.com" 
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 
                                        rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 
                                        focus:ring-purple-500 focus:outline-none"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    We'll email your API key to this address
                                </p>
                            </div>
                            
                            {selectedPlan === 'premium' && (
                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                                    <p className="text-sm text-purple-700 dark:text-purple-300 flex items-center gap-2">
                                        <Info className="h-4 w-4 flex-shrink-0" />
                                        You'll be redirected to our secure payment provider after requesting your API key.
                                    </p>
                                </div>
                            )}
            
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                    <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                                    Next Steps
                                </h3>
                                <ol className="text-sm text-gray-600 dark:text-gray-400 space-y-2 list-decimal list-inside pl-2">
                                    <li>Request your API key</li>
                                    <li>Check your email for the key</li>
                                    <li>Return here to complete your account setup</li>
                                </ol>
                            </div>
                        </div>
                        
                        {selectedPlan === 'standard' && (
                            <div className="mb-6">
                                <Turnstile
                                    siteKey={process.env.REACT_APP_TURNSTILE_SITE_KEY || ''}
                                    onSuccess={(token) => {
                                        setTurnstileToken(token);
                                        setShowTurnstileError(false);
                                    }}
                                    onError={() => {
                                        setTurnstileToken('');
                                        setShowTurnstileError(true);
                                    }}
                                    onExpire={() => {
                                        setTurnstileToken('');
                                        setShowTurnstileError(true);
                                    }}
                                    options={{
                                        theme: theme === 'dark' ? 'dark' : 'light',
                                        size: 'normal'
                                    }}
                                />
                                {showTurnstileError && (
                                    <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                                        Please complete the security verification to continue
                                    </p>
                                )}
                            </div>
                        )}
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setCurrentStep('plans')}
                                className="flex-1 py-2 bg-transparent border border-gray-300 dark:border-gray-700 
                                    text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                Back
                            </button>
                            <button
                                onClick={requestApiKey}
                                disabled={!email || !email.includes('@') || (selectedPlan === 'standard' && !turnstileToken) || loading}
                                className={`flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg
                                    ${(!email || !email.includes('@') || (selectedPlan === 'standard' && !turnstileToken) || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Processing...
                                    </span>
                                ) : (
                                    selectedPlan === 'premium' ? 'Proceed to Payment' : 'Request API Key'
                                )}
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                        </p>
                    </>
                );

            case 'key-requested':
                return (
                    <>
                        {renderProgressIndicator()}
                        
                        <div className="text-center mt-6">
                            <div className="w-20 h-20 mx-auto mb-6 text-green-500 dark:text-green-400">
                                <CheckCircle className="w-full h-full" />
                            </div>
                            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                                API Key Sent!
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                We've sent an API key to {email}.<br />
                                Please check your inbox and spam folder.
                            </p>
                            
                            <div className="p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                    Did you receive your API key?
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Once you have your API key, continue to complete your account setup.
                                </p>
                                <button
                                    onClick={() => setCurrentStep('enter-api-key')}
                                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                                >
                                    I have my API key
                                </button>
                            </div>
                            
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                <p>Haven't received the email?</p>
                                <button 
                                    onClick={() => setCurrentStep('email')}
                                    className="text-purple-600 hover:text-purple-800 dark:text-purple-400 font-medium mt-1"
                                >
                                    Try again with a different email
                                </button>
                            </div>
                        </div>
                        
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                        </p>
                    </>
                );

            case 'enter-api-key':
                return (
                    <>
                        {renderProgressIndicator()}
                        
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white mt-6">
                            Complete Your Account Setup
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            Enter the API key you received via email to complete your account setup
                        </p>
                        
                        <div className="space-y-4 mb-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    API Key
                                </label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Paste your API key here" 
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 
                                        rounded-lg text-gray-900 dark:text-white focus:border-purple-500 focus:ring-1 
                                        focus:ring-purple-500 focus:outline-none font-mono"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    The API key should start with "{selectedPlan === 'premium' ? 'premium_' : 'free_'}"
                                </p>
                            </div>
            
                            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                    <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                                    Final Step
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    After entering your API key, you'll be registered as a TotemBound user and receive your welcome gift of 2000 TOTEM.
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setCurrentStep('email')}
                                className="flex-1 py-2 bg-transparent border border-gray-300 dark:border-gray-700 
                                    text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                Back
                            </button>
                            <button
                                onClick={handleSignupWithApiKey}
                                disabled={!apiKey || apiKey.trim() === '' || loading}
                                className={`flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg
                                    ${(!apiKey || apiKey.trim() === '' || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Creating Account...
                                    </span>
                                ) : (
                                    'Complete Signup'
                                )}
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                        </p>
                    </>
                );

            case 'advanced':
                return (
                    <>
                        {renderProgressIndicator()}
                        
                        <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white mt-6">
                            Ready for Advanced Mode
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-6 text-sm">
                            You'll manage your own transaction fees directly
                        </p>
                        
                        <div className="p-4 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                                Advanced Mode Details
                            </h3>
                            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                                <li className="flex items-start">
                                    <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5 mt-0.5" />
                                    <span>You'll pay standard network fees for each transaction</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5 mt-0.5" />
                                    <span>Full control over your game assets and transactions</span>
                                </li>
                                <li className="flex items-start">
                                    <Check className="h-3.5 w-3.5 text-blue-500 dark:text-blue-400 mr-1.5 mt-0.5" />
                                    <span>Can switch to Standard or Premium later</span>
                                </li>
                            </ul>
                        </div>
                        
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg mb-6">
                            <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                                <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 mr-2" />
                                Complete Setup
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                You'll be registered as a TotemBound user and receive your welcome gift of 2000 TOTEM.
                            </p>
                        </div>
                        
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setCurrentStep('plans')}
                                className="flex-1 py-2 bg-transparent border border-gray-300 dark:border-gray-700 
                                    text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                                Back
                            </button>
                            <button
                                onClick={handleSignupDirect}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg">
                                Complete Setup
                            </button>
                        </div>
                        
                        {error && (
                            <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                                {error}
                            </div>
                        )}
                        
                        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Connected: {normalizedAddress.slice(0, 6)}...{normalizedAddress.slice(-4)}
                        </p>
                    </>
                );

            case 'processing':
                return (
                    <>
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6">
                                <svg className="animate-spin w-full h-full text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                                Setting Up Your Account
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300">
                                This will only take a moment...
                            </p>
                        </div>
                    </>
                );
                
            case 'success':
                return (
                    <>
                        <div className="text-center">
                            <div className="w-20 h-20 mx-auto mb-6 text-green-500 dark:text-green-400">
                                <CheckCircle className="w-full h-full" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">
                                Welcome to TotemBound!
                            </h2>
                            <p className="text-gray-700 dark:text-gray-300 mb-6">
                                Your account has been created successfully
                            </p>
                            
                            <div className="p-4 bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-6">
                                <p className="text-green-800 dark:text-green-200">
                                    We've added 2000 TOTEM to your account to help you start your journey!
                                </p>
                            </div>
                            
                            <button
                                onClick={() => window.location.href = '/'}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 
                                    rounded-lg w-full text-lg transition-all">
                                Enter TotemBound
                            </button>
                        </div>
                    </>
                );
                
            default:
                return <div>Unknown step</div>;
        }
    };

    return (
        <div className="p-2 sm:p-4 md:p-6 bg-gray-50 dark:bg-gray-900 rounded-lg max-w-[95%] md:max-w-2xl mx-auto 
            shadow-lg border border-gray-100 dark:border-gray-700 relative">
            {renderStepContent()}
        </div>
    );
};

