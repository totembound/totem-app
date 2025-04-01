import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTotemGame } from '../../hooks/useTotemGame';
import { ethers } from 'ethers';
import { createTotemNFTContract } from '../../config/contracts';
import { getCurrentMonth } from '../../utils/totems';

// Monthly Special Totems data
const monthlySpecials = [
    {
        id: 'february-2025',
        bundleId: 1,
        name: 'Lovewave Otter (Rosy Pink)',
        description: 'A gentle-hearted otter, spreading warmth and joy.',
        baseSpecies: 'Otter',
        price: 250,
        tokenAmount: 10000,
        image: 'https://ipfs.io/ipfs/bafybeidsydwaidnhrygqk3iqrp6eiwt4jr6ipfpjsl7pgesoq7poks6yqy',
        month: 1 // February
    },
    {
        id: 'march-2025',
        bundleId: 2,
        name: 'Cloverfang Wolf (Verdant Gold)',
        description: 'A wolf of fortune, blessed by the winds of luck.',
        baseSpecies: 'Wolf',
        price: 250,
        tokenAmount: 10000,
        image: 'https://ipfs.io/ipfs/bafybeifbciz4p5f37dc6hluakcrvodmytqpmwspbdr47sbqijxtfk2p654',
        month: 2 // March
    },
    {
        id: 'april-2025',
        bundleId: 3,
        name: 'Thunderstrike Falcon (Raindrop Teal)',
        description: 'A stormbringer of the spring skies, calling the rain and lightning to its wings.',
        baseSpecies: 'Falcon',
        price: 250,
        tokenAmount: 10000,
        image: 'https://ipfs.io/ipfs/bafybeie4a3o2dz6zd7fdtefcj3cn75hmdt4p2abd5hezdogzbu2fapx26m',
        month: 3 // April
    }
];

interface SpecialOffersViewProps {
    onPurchased: (purchased: any) => void;
}

// Special Offers Section Component
const SpecialOffers: React.FC<SpecialOffersViewProps> = ({
    onPurchased
}) => {
    const currentMonth = new Date().getMonth();
    const currentMonthlySpecial = monthlySpecials.find(special => special.month === currentMonth);
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState<{[key: string]: boolean}>({});
    const { updateBalances, addTotem, showError, provider } = useUser();
    const { purchaseBundle } = useTotemGame();

    const handlePurchaseBundle = async (bundleId: number, polAmount: number) => {
        setLoading(prev => ({ ...prev, [bundleId]: true }));
        
        try {
            const polValue = ethers.parseEther(polAmount.toString());
            const tokenId = await purchaseBundle(bundleId, polValue);
            console.log(`Purchased bundle ${bundleId}, received totem:`, tokenId);

            if (provider) {
                // Get the NFT metadata from contract
                const nftContract = createTotemNFTContract(provider);
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
                onPurchased({
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
            await addTotem(tokenId);
        }
        catch (err) {
            showError("Error", "Failed to purchase bundle. Try again shortly.");
            console.error(err);
        }
        finally {
            setLoading(prev => ({ ...prev, [bundleId]: false }));
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with Toggle */}
            <div className="flex items-center justify-left">
                <div className="flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
                    <h2 className="text-2xl font-bold dark:text-gray-200">Special Offers</h2>
                </div>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2 ml-4 px-3 py-1.5 rounded-lg text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                >
                    <span className="text-sm font-medium">
                        {isExpanded ? 'hide' : 'show'}
                    </span>
                    {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )}
                </button>
            </div>

            {isExpanded && (

            <div className="grid grid-cols-1 md:grid-cols-10 gap-4">

            {/* Regular Bundles - 3 column grid */}
            <div className="col-span-1 md:col-span-4 space-y-4">
                {/* New Player Bundle */}
                <div className="bg-green-50/50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200/50 dark:border-green-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-green-900 dark:text-green-200">New Player Bundle</h3>
                            <p className="text-green-800 dark:text-green-300 text-base mt-2">
                                {Number(1000).toLocaleString()} TOTEM tokens and a mysterious spirit totem!
                            </p>
                        </div>
                        <span className="bg-green-100 text-green-600 dark:bg-green-800 dark:text-green-300 px-2 py-1 rounded text-sm">
                            Starter
                        </span>
                    </div>
                    <button 
                        onClick={() => handlePurchaseBundle(0, 10)}
                        disabled={loading[0]}
                        className="w-full bg-green-500 text-white py-2 px-4 rounded font-semibold 
                            hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-600 mt-4
                            disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading[0] ? 'Processing...' : `Claim for 10 POL`}
                    </button>
                </div>

                {/* Weekly Rare Package */}
                <div className="bg-blue-50/50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-blue-900 dark:text-blue-200">Weekly Rare Special</h3>
                            <p className="text-blue-800 dark:text-blue-300 text-base mt-2">
                                {Number(2000).toLocaleString()} TOTEM tokens and random rare totem!
                            </p>
                        </div>
                        <span className="bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300 px-2 py-1 rounded text-sm">
                            Popular
                        </span>
                    </div>
                    <button 
                        onClick={() => handlePurchaseBundle(1, 20)}
                        disabled={loading[1]}
                        className="w-full bg-blue-500 text-white py-2 px-4 rounded font-semibold 
                            hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-600 mt-4
                            disabled:opacity-50 disabled:cursor-not-allowed">
                        {loading[1] ? 'Processing...' : `Claim for 20 POL`}
                    </button>
                </div>

                {/* Weekly Epic Package */}
                <div className="bg-purple-50/50 dark:bg-purple-900/20 rounded-lg p-6 border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-purple-900 dark:text-purple-200">Weekly Epic Special</h3>
                            <p className="text-purple-800 dark:text-purple-300 text-base mt-2">
                                {Number(5000).toLocaleString()} TOTEM tokens and random epic totem!
                            </p>
                        </div>
                        <span className="bg-purple-100 text-purple-600 dark:bg-purple-800 dark:text-purple-300 px-2 py-1 rounded text-sm">
                            Exclusive
                        </span>
                    </div>
                    <button 
                        onClick={() => handlePurchaseBundle(2, 50)}
                        disabled={loading[2]}
                        className="w-full bg-purple-500 text-white py-2 px-4 rounded font-semibold 
                            hover:bg-purple-600 dark:bg-purple-700 dark:hover:bg-purple-600 mt-4
                            disabled:opacity-50 disabled:cursor-not-allowed">
                        
                        {loading[2] ? 'Processing...' : `Claim for 50 POL`}
                    </button>
                </div>
            </div>

            {/* Monthly Special - Full width section */}
            {currentMonthlySpecial && (
                <div className="col-span-1 md:col-span-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 border border-amber-200/50 dark:border-amber-800/50">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="font-bold text-2xl text-amber-900 dark:text-amber-200">
                            Monthly Totem Series
                        </h3>
                        <span className="bg-amber-100 text-amber-600 dark:bg-amber-800 dark:text-amber-300 px-3 py-1.5 rounded text-sm font-medium">
                            Limited Time
                        </span>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Info Section */}
                        <div className="flex flex-col gap-4 h-full justify-stretch">
                            <div>
                                <h4 className="font-bold text-lg text-amber-800 dark:text-amber-300">
                                    {currentMonthlySpecial.name}
                                </h4>
                                <div className="text-amber-800 dark:text-amber-300">
                                    {getCurrentMonth()} Edition
                                </div>
                                <p className="text-amber-800 dark:text-amber-300 text-base mt-4 leading-relaxed">
                                    {currentMonthlySpecial.description}
                                </p>
                            </div>
                            
                            <div className="bg-amber-100/50 dark:bg-amber-900/30 rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-amber-900 dark:text-amber-200 font-medium">Bonus Tokens</span>
                                    <span className="text-amber-800 dark:text-amber-300 font-bold">
                                        {Number(currentMonthlySpecial.tokenAmount).toLocaleString()} TOTEM
                                    </span>
                                </div>
                            </div>
                        
                        </div>
                        {/* Image Section */}
                        <div className="relative aspect-square bg-gray-200 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                            <img
                                src={currentMonthlySpecial.image}
                                alt={currentMonthlySpecial.name}
                                className="absolute inset-0 w-full h-full object-contain"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <button 
                            onClick={() => handlePurchaseBundle(3, currentMonthlySpecial.price)}
                            disabled={loading[3]}
                            className="w-full bg-amber-500 text-white py-3 px-4 rounded font-semibold 
                                hover:bg-amber-600 dark:bg-amber-700 dark:hover:bg-amber-600 text-lg 
                                disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading[3] ? 'Processing...' : `Claim for ${currentMonthlySpecial.price} POL`}
                        </button>
                    </div>
                    <div className="mt-4 text-gray-900 dark:text-gray-100 text-sm">
                        <p>
                           Each month, a unique, time-limited Totem will be available, embodying the spirit of the season with a stunning themed design and exclusive traits. 🌙✨
                        </p>
                        <ul className="mt-1">
                            <li>✔ Limited Edition – Only available during its designated month!</li>
                            <li>✔ Seasonal Themes – Inspired by nature’s cycles, celestial events, and folklore!</li>
                            <li>✔ Exclusive Designs & Traits – Unique colors, animations, and lore!</li>
                            <li>✔ Perfect for Collectors – Build your legendary Totem Collection all year long!</li>
                        </ul>
                    </div>
                </div>
                )}
            </div>
            )}
        </div>
    );
};

export default SpecialOffers;