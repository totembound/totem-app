import { useEffect, useState, useCallback } from 'react';
import { Edit2, Coffee, Dumbbell, Heart, Sparkles, LoaderCircle } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useGameActions } from '../utils/gameActions';
import { useTotemGame } from '../hooks/useTotemGame';
import { createTotemNFTContract, createGameContract, TotemGameContract } from '../config/contracts';
import { NFTMetadata, TotemAttributes, Rarity, Species, Color } from '../types/types';
import { ActionType, ActionTracking, TokenActionTrackings } from '../types/types';
import DisplayNameEditor from './DisplayNameEditor';

const TotemGallery = () => {
    const { address, provider, isConnected, updateBalances, totemUpdated, totemUpdateCounter } = useUser();
    const [nfts, setNfts] = useState<(NFTMetadata & { attributes: TotemAttributes, trackings: TokenActionTrackings })[]>([]);
    const { canUseAction } = useGameActions();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [editingName, setEditingName] = useState<bigint | null>(null);
    const { feed, train, treat, evolve } = useTotemGame();

    // Experience thresholds for evolution
    const STAGE_THRESHOLDS = [0, 500, 1500, 3500, 7500];
    const SECONDS_PER_DAY = 86400;

    const fetchNFTs = useCallback(async () => {
        if (!provider || !address || !isConnected) return;

        setLoading(true);
        setError(null);

        try {
            const contract = createTotemNFTContract(provider);
            const tokenIds = await contract.tokensOfOwner(address);
            const gameContract = createGameContract(provider) as TotemGameContract;

            const trackings = await Promise.all(tokenIds.map(async (tokenId) => {
                const tokenTrackings: {[key in ActionType]?: ActionTracking} = {};
                    
                // Fetch tracking for each action type
                for (const actionType of [
                        ActionType.Feed, 
                        ActionType.Train, 
                        ActionType.Treat
                    ]) {
                        try {
                            const tracking = await gameContract.getActionTracking(tokenId, actionType);
                            tokenTrackings[actionType] = {
                                lastUsed: Math.min(Number(tracking.lastUsed), Math.floor(Date.now() / 1000)),
                                dailyUses: Number(tracking.dailyUses),
                                dayStartTime: Math.min(Number(tracking.dayStartTime), Math.floor(Date.now() / 1000) + SECONDS_PER_DAY)
                            };
                        } catch (err) {
                            console.error(`Error fetching tracking for token ${tokenId}, action ${actionType}:`, err);
                            // Provide default tracking
                            tokenTrackings[actionType] = {
                                lastUsed: 0,
                                dailyUses: 0,
                                dayStartTime: 0
                            };
                        }
                    }

                    return { 
                        tokenId: tokenId.toString(), 
                        tracking: tokenTrackings 
                    };
                }));

                // Convert to a more accessible object with explicit typing
            const trackingMap: TokenActionTrackings = trackings.reduce((acc, item) => {
                acc[item.tokenId] = item.tracking;
                return acc;
            }, {} as TokenActionTrackings);

            const nftData = await Promise.all(tokenIds.map(async (tokenId) => {
                // Get on-chain attributes
                console.log(contract);
                // Get IPFS metadata
                const uri = await contract.tokenURI(tokenId);
                const ipfsMetadata = await fetch(uri.replace('ipfs://', 'https://ipfs.io/ipfs/')).then(res => res.json());

                // Get on-chain attributes
                const attrs = await contract.attributes(tokenId) as any;
                // Convert attributes to our expected format
                const parsedAttributes: TotemAttributes = {
                    species: Number(attrs[0]),     // Species enum
                    color: Number(attrs[1]),       // Color enum
                    rarity: Number(attrs[2]),      // Rarity enum
                    happiness: Number(attrs[3]),   // uint256
                    experience: Number(attrs[4]),  // uint256
                    stage: Number(attrs[5]),       // uint256
                    isStaked: Boolean(attrs[6]),   // bool
                    displayName: attrs[7] ?? ''    // string
                };

                const parsed = {
                    id: tokenId,
                    tokenId: tokenId.toString(),
                    ...ipfsMetadata,
                    attributes: parsedAttributes,
                    trackings: trackingMap[tokenId.toString()] || {}
                };
                console.log(parsed);
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

    const handleFeed = async (tokenId: bigint) => {
        try {
            await feed(tokenId);
            await updateBalances();
            totemUpdated(tokenId);
        }
        catch (err) {
            console.error('Error feeding totem:', err);
        }
    };

    const handleTreat = async (tokenId: bigint) => {
        try {
            await treat(tokenId);
            await updateBalances();
            totemUpdated(tokenId);
        }
        catch (err) {
            console.error('Error training totem:', err);
        }
    };

    const handleTrain = async (tokenId: bigint) => {
        try {
            await train(tokenId);
            await updateBalances();
            totemUpdated(tokenId);
        }
        catch (err) {
            console.error('Error training totem:', err);
        }
    };

    const handleEvolve = async (tokenId: bigint) => {
        try {
            await evolve(tokenId);
            totemUpdated(tokenId);
        }
        catch (err) {
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

    const formatDisplayName = (name: any) => {
        // If name is null, undefined, or not a string, return default
        if (name == null || typeof name !== 'string') {
            return 'Set nickname...';
        }
        
        // If name contains only special characters/boxes, treat as empty
        if (/^[\u{FFF0}-\u{FFFF}\u{10FFFF}]+$/u.test(name)) {
            return 'Set nickname...';
        }
    
        // If it's just spaces or invisible characters
        if (!name.trim()) return 'Set nickname...';
    
        // Otherwise show the name with quotes
        return `"${name}"`;
    };

    const noneFoundMessage = nfts.length === 0 ? <div>
        Your Totems will appear here once you've started collecting! Use the Game Controls to buy your first Totem.
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
                {nfts.map((nft) => {
                    // Safely get the tracking for each action type
                    const feedTracking = nft.trackings?.[ActionType.Feed] ?? {
                        lastUsed: 0,
                        dailyUses: 0,
                        dayStartTime: 0
                    };

                    const trainTracking = nft.trackings?.[ActionType.Train] ?? {
                        lastUsed: 0,
                        dailyUses: 0,
                        dayStartTime: 0
                    };

                    const treatTracking = nft.trackings?.[ActionType.Treat] ?? {
                        lastUsed: 0,
                        dailyUses: 0,
                        dayStartTime: 0
                    };

                    // Calculate action availability
                    const canFeed = canUseAction(
                        nft.attributes, 
                        ActionType.Feed,
                        feedTracking
                    );

                    const canTrain = canUseAction(
                        nft.attributes, 
                        ActionType.Train,
                        trainTracking
                    );

                    const canTreat = canUseAction(
                        nft.attributes, 
                        ActionType.Treat,
                        treatTracking
                    );

                    return (
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
                                    <DisplayNameEditor
                                        tokenId={nft.tokenId}
                                        currentName={nft.attributes.displayName}
                                        onClose={async () => {
                                            setEditingName(null);
                                            await updateBalances();
                                            totemUpdated(nft.tokenId);
                                        }}
                                    />
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm text-gray-600 italic">
                                            {formatDisplayName(nft.attributes.displayName || null)}
                                        </p>
                                        <button
                                            onClick={() => setEditingName(nft.tokenId)}
                                            className="text-gray-400 hover:text-gray-600"
                                        >
                                            <Edit2 size={14} />
                                        </button>
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
                                            onClick={() => handleTreat(nft.tokenId)}
                                            disabled={!canTreat}
                                            className={`p-2 rounded-full ${
                                                canTreat
                                                    ? 'bg-pink-100 text-pink-600 hover:bg-pink-200'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={canTrain ? 'Treat' : 'Need to wait 4 hrs to treat again'}
                                        >
                                            <Heart size={20} />
                                        </button>
                                        <button
                                            onClick={() => { console.log(nft); handleFeed(nft.tokenId); }}
                                            disabled={!canFeed}
                                            className={`p-2 rounded-full ${
                                                canFeed ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={canFeed ? 'Feed' : 'Can feed after UTC midnight, 8am or 4pm, not at max happiness'}
                                        >
                                            <Coffee size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleTrain(nft.tokenId)}
                                            disabled={!canTrain}
                                            className={`p-2 rounded-full ${
                                                canTrain
                                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            title={canTrain ? 'Train' : 'Need happiness ≥ 20 to train'}
                                        >
                                            <Dumbbell size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        </div>
    );
};

export default TotemGallery;