import React, { useState, useRef, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useGame } from '../contexts/GameContext';
import { useUser } from '../contexts/UserContext';
import { RateLimitError } from '../types/types';

interface DisplayNameEditorProps {
    tokenId: bigint;
    currentName: string;
    onClose: () => void;
}

const DisplayNameEditor: React.FC<DisplayNameEditorProps> = ({
    tokenId,
    currentName,
    onClose
}) => {
    const [newName, setNewName] = useState(currentName || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { showError, handleRateLimitError } = useUser();
    const { setDisplayName } = useGame();
    const inputRef = useRef<HTMLInputElement>(null);

    // Auto-focus the input when component mounts
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
            // Select all text for easy replacement
            inputRef.current.select();
        }
    }, []);

    const handleUpdate = async () => {
        setIsSubmitting(true);
        try {
            await setDisplayName(tokenId, newName.trim());
            onClose();
        }
        catch (err) {
            console.error('Error updating name:', err);
            
            if (err instanceof RateLimitError) {
                handleRateLimitError(err);
            } else {
                showError("Error", "Failed to update name. Try again shortly.");
            }
        }
        finally {
            setIsSubmitting(false);
        }
    };

    // Handle Enter key for submission
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleUpdate();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className="flex items-center gap-2 max-w-full w-full">
            <div className="relative flex-1">
                <input
                    ref={inputRef}
                    type="text"
                    value={newName}
                    onChange={(e) => {
                        setNewName(e.target.value);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full px-2 py-1 text-sm rounded-lg border 
                        bg-white dark:bg-gray-800 
                        border-gray-300 dark:border-gray-700 
                        text-gray-900 dark:text-gray-200 
                        placeholder-gray-500 dark:placeholder-gray-500
                        focus:border-blue-500 dark:focus:border-blue-500 
                        focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-500
                        focus:outline-none
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    placeholder="Enter nickname..."
                    maxLength={32}
                    disabled={isSubmitting}
                />
            </div>
            <div className="flex items-center gap-1">
                <button
                    onClick={handleUpdate}
                    disabled={isSubmitting}
                    className="p-1 rounded-full
                        bg-green-100 dark:bg-green-900/30
                        hover:bg-green-200 dark:hover:bg-green-800/50 
                        text-green-600 dark:text-green-400 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    title="Save"
                    aria-label="Save nickname"
                >
                    {isSubmitting ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <Check size={16} />
                    )}
                </button>
                <button
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="p-1 rounded-full
                        bg-red-100 dark:bg-red-900/30
                        hover:bg-red-200 dark:hover:bg-red-800/50
                        text-red-600 dark:text-red-400 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-colors duration-200"
                    title="Cancel"
                    aria-label="Cancel editing"
                >
                    <X size={16} />
                </button>
            </div>
        </div>
    );
};

export default DisplayNameEditor;