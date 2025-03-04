import React, { useState } from 'react';
import {Check, X } from 'lucide-react';
import { useGame } from '../contexts/GameContext';

const DisplayNameEditor: React.FC<{
    tokenId: bigint;
    currentName: string;
    onClose: () => void;
}> = ({ tokenId, currentName, onClose }) => {
    const [newName, setNewName] = useState(currentName || '');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { setDisplayName } = useGame();

    const handleUpdate = async () => {
        if (!newName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        setIsSubmitting(true);
        try {
            await setDisplayName(tokenId, newName.trim());
            onClose();
        }
        catch (err) {
            console.error('Error updating name:', err);
            setError(err instanceof Error ? err.message : 'Failed to update name');
        }
        finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="px-2 py-1 text-sm rounded border 
                        bg-white dark:bg-gray-800 
                        border-gray-300 dark:border-gray-700 
                        text-gray-900 dark:text-gray-200 
                        placeholder-gray-500 dark:placeholder-gray-500
                        focus:border-purple-500 dark:focus:border-purple-500 
                        focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-500
                        focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    placeholder="Enter nickname..."
                    maxLength={32}
                    disabled={isSubmitting}
                />
                <button
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className="p-1 rounded 
                        hover:bg-gray-100 dark:hover:bg-gray-700 
                        text-gray-500 dark:text-gray-400 
                        hover:text-green-600 dark:hover:text-green-400
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    title="Save"
                >
                     {isSubmitting ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                    ) : (
                        <Check size={16} />
                    )}
                </button>
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="p-1 rounded 
                        hover:bg-gray-100 dark:hover:bg-gray-700 
                        text-gray-500 dark:text-gray-400 
                        hover:text-red-600 dark:hover:text-red-400
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    title="Cancel"
                >
                    <X size={16} />
                </button>
                {error && (
                    <span className="text-red-500 text-sm">{error}</span>
                )}
            </div>
        </div>
    );
};

export default DisplayNameEditor;