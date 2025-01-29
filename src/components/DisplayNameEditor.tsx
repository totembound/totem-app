import React, { useState } from 'react';
import {Check, X } from 'lucide-react';
import { useTotemGame } from '../hooks/useTotemGame';

const DisplayNameEditor: React.FC<{
    tokenId: bigint;
    currentName: string;
    onClose: () => void;
}> = ({ tokenId, currentName, onClose }) => {
    const [newName, setNewName] = useState(currentName || '');
    const [error, setError] = useState('');
    const { setDisplayName } = useTotemGame();

    const handleUpdate = async () => {
        if (!newName.trim()) {
            setError('Name cannot be empty');
            return;
        }

        try {
            await setDisplayName(tokenId, newName.trim());
            onClose();
        } catch (err) {
            console.error('Error updating name:', err);
            setError(err instanceof Error ? err.message : 'Failed to update name');
        }
    };

    return (
        <div className="flex items-center gap-2">
            <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-48"
                placeholder="Enter nickname..."
                maxLength={32}
            />
            <button
                onClick={handleUpdate}
                className="text-green-600 hover:text-green-800"
                title="Save"
            >
                <Check size={16} />
            </button>
            <button
                onClick={onClose}
                className="text-red-600 hover:text-red-800"
                title="Cancel"
            >
                <X size={16} />
            </button>
            {error && (
                <span className="text-red-500 text-sm">{error}</span>
            )}
        </div>
    );
};

export default DisplayNameEditor;