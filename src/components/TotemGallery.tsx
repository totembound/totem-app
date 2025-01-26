import { useEffect, useState, useCallback } from 'react';
import { Edit2, Coffee, Dumbbell, Check, X, Sparkles, LoaderCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTotemGame } from '../hooks/useTotemGame';
import { createTotemNFTContract } from '../config/contracts';
import { NFTMetadata, TotemAttributes, Rarity, Species, Color } from '../types/types';

const TotemGallery = () => {
    const { address, provider, isConnected, updateBalances, totemUpdated, totemUpdateCounter } = useUser();
    const [nfts, setNfts] = useState<(NFTMetadata & { attributes: TotemAttributes })[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<bigint | null>(null);
    const [newName, setNewName] = useState('');
    const { feed, train, evolve, setDisplayName } = useTotemGame();

    // Experience thresholds for evolution
    
    const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];
    
    const fetchNFTs = useCallback(async () => {
        if (!provider || !address || !isConnected) return;

        setLoading(true);
        setError(null);

        try {
            const contract = createTotemNFTContract(provider);
            const tokenIds = await contract.tokensOfOwner(address);
            const nftData = await Promise.all(tokenIds.map(async (tokenId) => {
                // Get on-chain attributes
                console.log(contract);
                const attrs = await contract.attributes(tokenId);
                // Get IPFS metadata
                const uri = await contract.tokenURI(tokenId);
                const ipfsMetadata = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.json());
                const parsed = {
                    id: tokenId,
                    tokenId: tokenId.toString(),
                    ...ipfsMetadata,
                    attributes: {
                        species: Number(attrs.species),
                        color: Number(attrs.color),
                        rarity: Number(attrs.rarity),
                        happiness: Number(attrs.happiness),
                        experience: Number(attrs.experience),
                        stage: Number(attrs.stage),
                        lastFed: Number(attrs.lastFed),
                        isStaked: attrs.isStaked,
                        displayName: attrs.displayName
                    }
                };
                return parsed;
            }));

            setNfts(nftData);
        } catch (err) {
            console.error('Error fetching NFTs:', err);
            setError('Failed to load your Totem NFTs. Please try again.');
        } finally {
            setLoading(false);
        }
    }, [provider, address, isConnected]);

    useEffect(() => {
        fetchNFTs();
    }, [totemUpdateCounter, fetchNFTs]);

    const canFeed = (attr: TotemAttributes) => {
        if (attr.happiness === 100) return false;
    
        const now = Math.floor(Date.now() / 1000);
        const lastFedTime = attr.lastFed;
        
        // Get current UTC day start
        const todayUTC = Math.floor(now / 86400) * 86400;
        
        // Define feeding windows (in seconds since day start)
        const feedWindows = [
            { start: 0,      end: 28800 },  // 00:00 - 08:00
            { start: 28800,  end: 57600 },  // 08:00 - 16:00
            { start: 57600,  end: 86400 }   // 16:00 - 24:00
        ];
        
        // Get seconds since start of UTC day
        const secondsIntoDay = now - todayUTC;
        
        // Find current window
        const currentWindow = feedWindows.find(
            window => secondsIntoDay >= window.start && secondsIntoDay < window.end
        );
        
        if (!currentWindow) return false;
        
        // Check if last feed was in current window
        const lastFedSecondsIntoDay = lastFedTime - Math.floor(lastFedTime / 86400) * 86400;
        const lastFedDay = Math.floor(lastFedTime / 86400) * 86400;
        
        return todayUTC > lastFedDay || 
               (todayUTC === lastFedDay && 
                (lastFedSecondsIntoDay < currentWindow.start || 
                 lastFedSecondsIntoDay >= currentWindow.end));
    };

    const handleFeed = async (tokenId: bigint) => {
        try {
            await feed(tokenId);
            await updateBalances();
            totemUpdated(tokenId);
        } catch (err) {
            console.error('Error feeding totem:', err);
        }
    };

    const handleTrain = async (tokenId: bigint) => {
        try {
            await train(tokenId);
            await updateBalances();
            totemUpdated(tokenId);
        } catch (err) {
            console.error('Error training totem:', err);
        }
    };
    
    const handleUpdateName = async (tokenId: bigint) => {
        if (!newName.trim()) return;
        try {
            await setDisplayName(tokenId, newName);
            await updateBalances();
            totemUpdated(tokenId);
            setEditingName(null);
            setNewName('');
        } catch (err) {
            console.error('Error updating name:', err);
        }
    };
    
    const handleEvolve = async (tokenId: bigint) => {
        try {
            await evolve(tokenId);
            totemUpdated(tokenId);
        } catch (err) {
            console.error('Error evolving totem:', err);
        }
    };

    const getRarityColor = (rarity: Rarity) => {
        switch(rarity) {
            case Rarity.Common: return 'text-gray-600';
            case Rarity.Uncommon: return 'text-green-600';
            case Rarity.Rare: return 'text-blue-600';
            case Rarity.Epic: return 'text-purple-600';
            case Rarity.Legendary: return 'text-yellow-600';
            default: return 'text-gray-600';
        }
    };

    const noneFoundMessage = nfts.length === 0 ? <div>
        Your Totems will appear here once you've started collecting! Use the Game Controls to buy your first Totem and begin your journey.
    </div>: <></>;

    if (loading) {
        return <>
            <LoaderCircle />
        </>
    }

    return (
        <div className="mt-4 p-6 bg-gray-50 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">My Totems</h2>
            {loading? <LoaderCircle />: <></>}
            {noneFoundMessage}
            {error && (
                <div className="mt-4 text-red-600">
                    Error: {error}
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {nfts.map((nft) => (
                    <div key={nft.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="aspect-w-1 aspect-h-1">
                            <img 
                                src={nft.image.replace('ipfs://', 'https://ipfs.io/ipfs/')} 
                                alt={nft.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                {editingName === nft.tokenId ? (
                                    <div className="flex items-center gap-2 pl-0">
                                        <input
                                            type="text"
                                            value={newName}
                                            onChange={(e) => setNewName(e.target.value)}
                                            className="border rounded px-2 py-1 text-sm w-48"
                                            placeholder="Enter nickname..."
                                        />
                                        <button
                                            onClick={() => handleUpdateName(nft.tokenId)}
                                            className="text-green-600 hover:text-green-800"
                                            title="Save"
                                        >
                                            <Check size={16} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingName(null);
                                                setNewName('');
                                            }}
                                            className="text-red-600 hover:text-red-800"
                                            title="Cancel"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col">
                                        <h3 className="font-semibold text-lg">{nft.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-gray-600 italic">
                                                {nft.attributes.displayName ? `"${nft.attributes.displayName}"` : 'Set nickname...'}
                                            </p>
                                            <button
                                                onClick={() => setEditingName(nft.tokenId)}
                                                className="text-gray-400 hover:text-gray-600 mt-1"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                <span className={`px-2 py-1 rounded-full text-sm ${getRarityColor(nft.attributes.rarity)}`}>
                                    {Rarity[nft.attributes.rarity]}
                                </span>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-sm">
                                    Species: <span className="font-medium">{Species[nft.attributes.species]}</span>
                                </p>
                                <p className="text-sm">
                                    Color: <span className="font-medium">{Color[nft.attributes.color]}</span>
                                </p>
                                <div className="flex justify-between text-sm">
                                    <div>
                                        XP: {nft.attributes.experience}
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div 
                                                className="bg-blue-600 rounded-full h-2"
                                                style={{ 
                                                    width: `${Math.min(100, (nft.attributes.experience / STAGE_THRESHOLDS[nft.attributes.stage + 1]) * 100)}%`
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <span>Stage: {nft.attributes.stage+1}/5</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Happiness: {nft.attributes.happiness}/100</span>
                                    <span>{nft.attributes.isStaked ? '🔒 Staked' : '🔓 Unstaked'}</span>
                                </div>
                                
                                <div className="flex justify-between gap-2 mt-4">
                                    {nft.attributes.experience >= STAGE_THRESHOLDS[nft.attributes.stage + 1] && (
                                        <button
                                            onClick={() => handleEvolve(nft.tokenId)}
                                            className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 animate-pulse shadow-lg shadow-purple-300"
                                            title="Evolution ready!"
                                        >
                                            <Sparkles size={20} />
                                        </button>
                                    )}
                                    <div className="flex gap-2 ml-auto">
                                        <button
                                            onClick={() => { console.log(nft); handleFeed(nft.tokenId); }}
                                            disabled={!canFeed(nft.attributes)}
                                            className={`p-2 rounded-full ${
                                                canFeed(nft.attributes)
                                                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={canFeed(nft.attributes) ? 'Feed' : 'Can feed after UTC midnight, 8am or 4pm, not at max happiness'}
                                        >
                                            <Coffee size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleTrain(nft.tokenId)}
                                            disabled={nft.attributes.happiness < 20}
                                            className={`p-2 rounded-full ${
                                                nft.attributes.happiness >= 20
                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={nft.attributes.happiness >= 20 ? 'Train' : 'Need happiness ≥ 20 to train'}
                                        >
                                            <Dumbbell size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TotemGallery;