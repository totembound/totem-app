import React, { useState } from 'react';
import { ethers } from 'ethers';
import { Settings, ScrollText } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useTotemGame } from '../hooks/useTotemGame';
import WalletConnectionDebugger from '../utils/WalletConnectionDebugger';

export const GameControls: React.FC = () => {
    const { address, isConnected, updateBalances, totemUpdated } = useUser();
    const { buyTokens, purchaseTotem } = useTotemGame();
    const { isSignedUp } = useUser();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [logs, setLogs] = useState<string[]>([]);
    const [selectedSpecies, setSelectedSpecies] = useState(0);
    const [showDebug, setShowDebug] = useState(false);
    const [showLogs, setShowLogs] = useState(true);

    // Add log helper
    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const handleBuyTokens = async () => {
        setLoading(true);
        setError('');
        try {
            const tx = await buyTokens(ethers.parseEther('100'));
            addLog(`Buying tokens with 100 POL... Tx: ${tx.hash}`);
            addLog('Token purchase complete!');
            updateBalances();
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to buy tokens';
            setError(message);
            addLog(`Error: ${message}`);
        }
        finally {
            setLoading(false);
        }
    };

    const handleBuyTotem = async () => {
        setLoading(true);
        setError('');
        try {
            const txHash = await purchaseTotem(selectedSpecies);
            addLog(`Purchasing ${speciesOptions[selectedSpecies]} totem... Tx: ${txHash}`);
            addLog('Totem purchase complete!');
            updateBalances();
            totemUpdated(0n);
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to buy totem';
            setError(message);
            addLog(`Error: ${message}`);
        }
        finally {
            setLoading(false);
        }
    };

    const speciesOptions = [
        'Goose', 'Otter', 'Wolf', 'Falcon', 'Beaver', 
        'Deer', 'Woodpecker', 'Salmon', 'Bear', 'Raven', 
        'Snake', 'Owl'
    ];

    // Early return if not connected or not signed up
    if (!isConnected || !address || !isSignedUp) {
        console.log('GameControls: Not showing', { isConnected, isSignedUp });
        return null;
    }

    return (
        <div className="mt-8 p-6 bg-white rounded-lg shadow">
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Game Controls</h2>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox"
                        checked={showLogs}
                        onChange={e => setShowLogs(e.target.checked)}
                        className="rounded"
                    />
                    <ScrollText size={16} />
                    Activity Log
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                    <input
                        type="checkbox" 
                        checked={showDebug}
                        onChange={e => setShowDebug(e.target.checked)}
                        className="rounded"
                    />
                    <Settings size={16} />
                    Debug Panel
                    </label>
                </div>
            </div>

            <div className="space-y-4">
                {/* Buy Tokens */}
                <div>
                    <button
                        onClick={handleBuyTokens}
                        disabled={loading}
                        className="bg-green-500 text-white font-bold px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
                    >
                        Buy Tokens (100 POL)
                    </button>
                </div>

                {/* Buy Totem */}
                <div className="flex space-x-4">
                    <select
                        value={selectedSpecies}
                        onChange={(e) => setSelectedSpecies(Number(e.target.value))}
                        className="border rounded px-2 py-1"
                    >
                        {speciesOptions.map((species, index) => (
                            <option key={species} value={index}>
                                {species}
                            </option>
                        ))}
                    </select>
                    <button
                        onClick={handleBuyTotem}
                        disabled={loading}
                        className="bg-blue-500 text-white font-bold px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                    >
                        Buy Totem (500 TOTEM)
                    </button>
                </div>

                {/* Debug & Logs */}
                <div className="space-y-4 mt-4">
                    {showLogs && (
                        <div className="mt-4">
                            <h3 className="font-bold">Activity Log</h3>
                            <div className="bg-gray-100 p-4 rounded h-40 overflow-y-auto">
                            {logs.map((log, index) => (
                                <div key={index} className="text-sm mb-1">{log}</div>
                            ))}
                            </div>
                        </div>
                    )}
                    {showDebug && <WalletConnectionDebugger />}
                </div>

                {error && (
                    <div className="text-red-600 mt-2">
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GameControls;
