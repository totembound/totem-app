import { useState } from 'react';
import { Lock, Coins, Sparkles, AlertTriangle } from 'lucide-react';
import { ethers } from 'ethers';
import { useUser } from '../../contexts/UserContext';
import { useTotemGame } from '../../hooks/useTotemGame';
import { createTotemNFTContract } from '../../config/contracts';
import CelebrationModal from '../CelebrationModal';
import ApprovalStatus from '../ApprovalStatus';
import TokensDisplay from '../TokensDisplay';
import SellTotemsShop from './SellTotemsShop';
import UnboundTotemsShop from './UnboundTotemsShop';

const ShopInterface = () => {
  const [activeTab, setActiveTab] = useState('totems');
  const [loading, setLoading] = useState(false);
  const [purchasingTotems, setPurchasingTotems] = useState<{[key: number]: boolean}>({});
  const [error, setError] = useState('');
  const { provider, updateBalances, addTotem, showError } = useUser();
  const { buyTokens, purchaseTotem } = useTotemGame();
  const [purchasedTotem, setPurchasedTotem] = useState<any>(null);

  // Available species data
  const availableSpecies = [
    { id: 11, name: 'Owl', available: true, emoji: '🦉' },
    { id: 10, name: 'Snake', available: false, emoji: '🐍' },
    { id: 9, name: 'Raven', available: false, emoji: '🦅' },
    { id: 8, name: 'Bear', available: false, emoji: '🐻' },
    { id: 7, name: 'Salmon', available: false, emoji: '🐟' },
    { id: 6, name: 'Woodpecker', available: false, emoji: '🐦' },
    { id: 5, name: 'Deer', available: false, emoji: '🦌' },
    { id: 4, name: 'Beaver', available: false, emoji: '🦫' },
    { id: 3, name: 'Falcon', available: false, emoji: '🦅' },
    { id: 2, name: 'Wolf', available: true, emoji: '🐺' },
    { id: 1, name: 'Otter', available: true, emoji: '🦦' },
    { id: 0, name: 'Goose', available: false, emoji: '🦢' }
  ];
  
  const tokenPackages = [
    { amount: '100', cost: '1', popular: false },
    { amount: '500', cost: '5', popular: true },
    { amount: '1000', cost: '10', popular: false },
    { amount: '10000', cost: '100', popular: false }
  ];

  const handleBuyTokens = async (polAmount: string) => {
      setLoading(true);
      setError('');
      try {
          const receipt = await buyTokens(ethers.parseEther(polAmount));
          console.log('Token purchase complete:', receipt);
          await updateBalances();
      }
      catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to buy tokens';
          setError(message);
          console.error('Purchase error:', err);
      }
      finally {
          setLoading(false);
      }
  };

  const handlePurchaseTotem = async (speciesId: number) => {
      setPurchasingTotems(prev => ({ ...prev, [speciesId]: true }));
      setError('');
      try {
          const tokenId = await purchaseTotem(speciesId);
          console.log(`Purchased totem ${speciesId}:`, tokenId);

          // Wait for transaction confirmation and get the token ID
          if (provider) {
              const nftContract = createTotemNFTContract(provider);
              // Get the NFT metadata from contract
              const [attributes, tokenURI] = await Promise.all([
                nftContract.attributes(tokenId),
                nftContract.tokenURI(tokenId)
              ]);

              console.log('Token URI:', tokenURI);
              console.log('Attributes:', attributes);
              
              // Fetch IPFS metadata
              const response = await fetch(tokenURI.replace('ipfs://', 'https://ipfs.io/ipfs/'));
              const metadata = await response.json();
              
              // Set the purchased NFT data for the celebration modal
              setPurchasedTotem({
                  id: tokenId.toString(),
                  name: metadata.name,
                  image: metadata.image,
                  attributes: {
                    rarity: Number(attributes.rarity),
                    displayName: attributes.displayName || metadata.name,
                    species: Number(attributes.species)
                  }
              });
          }

          await updateBalances();
          addTotem(tokenId);
      }
      catch (err) {
          //const message = err instanceof Error ? err.message : 'Failed to buy totem';
          showError("Error", "Failed to purchase totem. Try again shortly.");
          //setError(message);
          console.error(err);
      }
      finally {
          setPurchasingTotems(prev => ({ ...prev, [speciesId]: false }));
      }
  };

  // Tab selection styles
  const getTabStyle = (tabName: string) => 
    `px-4 py-2 font-semibold ${
      activeTab === tabName
        ? 'text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">

      {/* Welcome & Balance Area */}
      <div className="mb-6 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-4">
              <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to the Shop</h1>
                  <p className="text-gray-600 dark:text-gray-400">Discover mystical totems and embark on your spirit journey.</p>
              </div>
              
              <TokensDisplay/>
          </div>
      </div>
        
      {/* Approval Status */}
      <div className="mb-6">
          <ApprovalStatus />
      </div>

      {/* Special Offers Section */}
      <div className="border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
          <h2 className="text-2xl font-bold dark:text-gray-200">Special Offers</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-yellow-50/50 dark:bg-yellow-900/20 rounded-lg p-6 border border-yellow-200/50 dark:border-yellow-800/50 flex flex-col">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-yellow-900 dark:text-yellow-200">New Player Bundle</h3>
                  <p className="text-yellow-800 dark:text-yellow-300 text-base mb-2 leading-relaxed">
                  {Number(1000).toLocaleString()} TOTEM tokens and a mysterious spirit totem!
                  </p>
                </div>
                <span className="bg-yellow-100 text-yellow-600 dark:bg-yellow-800 dark:text-yellow-300 px-2 py-1 rounded text-sm">
                  Starter
                </span>
              </div>
            </div>
            <button className="w-full bg-yellow-500 text-white py-2 px-4 rounded font-semibold hover:bg-yellow-600 dark:bg-yellow-700 dark:hover:bg-yellow-600 mt-auto">
              Claim for 8 POL
            </button>
          </div>
          <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200/50 dark:border-blue-800/50 flex flex-col">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-blue-900 dark:text-blue-200">Weekly Special</h3>
                  <p className="text-blue-800 dark:text-blue-300 text-base mb-2 leading-relaxed">
                  {Number(2000).toLocaleString()} TOTEM tokens and unlock a rare totem color!
                  </p>
                </div>
                <span className="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm">
                  Popular
                </span>
              </div>
            </div>
            <button className="w-full bg-blue-500 text-white py-2 px-4 rounded font-semibold hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 mt-auto">
              Buy for 15 POL
            </button>
          </div>
          <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200/50 dark:border-purple-800/50 flex flex-col">
            <div className="flex-grow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-purple-900 dark:text-purple-200">Limited Time</h3>
                  <p className="text-purple-800 dark:text-purple-300 text-base mb-2 leading-relaxed">
                  {Number(5000).toLocaleString()} TOTEM tokens and unlock an epic color!
                  </p>
                </div>
                <span className="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300 px-2 py-1 rounded text-sm">
                  Exclusive
                </span>
              </div>
            </div>
            <button className="w-full bg-purple-500 text-white py-2 px-4 rounded font-semibold hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600 mt-auto">
              Buy for 40 POL
            </button>
          </div>
        </div>
      </div>

      {/* Shop Container */}
      <div className="mt-6">

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('totems')}
            className={getTabStyle('totems')}
          >
            Totems
          </button>
          <button
            onClick={() => setActiveTab('unbound')}
            className={getTabStyle('unbound')}
          >
            Unbound Totems
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={getTabStyle('tokens')}
          >
            TOTEM Tokens
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={getTabStyle('sell')}
          >
            Sell Totems
          </button>
        </div>

        {/* Content Area */}
        <div className="pt-6">
          {/* Totems Shop */}
          {activeTab === 'totems' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Totem Marketplace</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Discover young spirit companions waiting for a new keeper. 
                  These totems range in color and rarity, from common to legendary, based on achievement progression, and is determined randomly. 
                  Your new totem will begin their journey at stage 1, and requires dedicated care, training, and love to unlock their full potential.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {availableSpecies.map((species) => (
                  <div 
                    key={species.id}
                    className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden
                      ${species.available ? '' : 'opacity-75'}`}
                  >
                    {/* Totem Image */}
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-500">
                        <span className="text-6xl">{species.emoji}</span>
                      </div>
                      {!species.available && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 dark:bg-opacity-60">
                          <div className="bg-gray-800 dark:bg-gray-700 text-white px-3 py-1 rounded-full flex items-center">
                            <Lock className="w-4 h-4 mr-1" />
                            Coming Soon
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Totem Info */}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg dark:text-gray-200">{species.name}</h3>
                        <span className="text-sm bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                          500 TOTEM
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        Mystical {species.name} Spirit
                      </p>
                      <button
                        onClick={() => species.available && handlePurchaseTotem(species.id)}
                        disabled={!species.available || purchasingTotems[species.id]}
                        className={`w-full py-2 px-4 rounded font-semibold
                          ${species.available
                            ? 'bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600'
                            : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                          } disabled:opacity-50`}
                      >
                        {purchasingTotems[species.id] ? 'Purchasing...' : 
                        (species.available ? 'Buy Totem' : 'Coming Soon')}
                      </button>
                    </div>
                  </div>
                ))}
                {/* Celebration Modal */}
                {purchasedTotem && (
                  <CelebrationModal
                    type="purchase"
                    totem={purchasedTotem}
                    onClose={() => setPurchasedTotem(null)}
                  />
                )}
              </div>
            </div>
          )}

          {/* Unbound Totems Shop */}
          {activeTab === 'unbound' && (
            <UnboundTotemsShop />
          )}

          {/* Token Shop */}
          {activeTab === 'tokens' && (
              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Token Vault</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Fuel the spirit realm and support our gasless infrastructure by purchasing TOTEM tokens. 
                    Your contributions directly support the game's ecosystem, enabling smooth, 
                    fee-free transactions and supporting the continued evolution of our mystical world. 
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tokenPackages.map((pkg) => (
                  <div 
                    key={pkg.amount}
                    className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm 
                      ${pkg.popular 
                        ? 'border-purple-500 dark:border-purple-700 border-2 dark:bg-gray-800/70' 
                        : 'border-gray-200 dark:border-gray-700'}`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-2xl text-gray-900 dark:text-gray-100">{Number(pkg.amount).toLocaleString()} TOTEM</h3>
                          <p className="text-gray-600 dark:text-gray-400">Cost: {pkg.cost} POL</p>
                        </div>
                        {pkg.popular && (
                          <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 px-2 py-1 rounded text-sm">
                            Popular
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => handleBuyTokens(pkg.cost)}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded font-semibold 
                          hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 
                          disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        {loading ? 'Processing...' : 'Buy Tokens'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
                
                {error && (
                  <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded">
                    {error}
                  </div>
                )}
            </div>
          )}

          {/* Sell Interface */}
          {activeTab === 'sell' && (
            <div className="space-y-6">
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-gray-100">Sell Your Totems</h3>
                <div className="space-y-3 text-gray-600 dark:text-gray-400">
                  <p>
                    
                    When you sell a totem, it becomes <span className="font-medium text-gray-900 dark:text-gray-300">Unbound</span> and 
                    enters the marketplace. You'll receive TOTEM tokens based on the totem's stage and rarity.
                  </p>

                  <div className="mt-4 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400 mt-1 flex-shrink-0" />
                    <div>
                      <p>You'll need to approve the transfer of your totem to the marketplace. This is a one-time transaction for each totem you want to sell.</p>
                    </div>
                  </div>
                </div>

              </div>

              <SellTotemsShop />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ShopInterface;
