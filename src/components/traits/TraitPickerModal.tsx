import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import {
    getTraitsBySlot,
    getTraitById,
    type TraitSlot,
    type TraitDefinition,
} from '../../config/traits';
import { TraitIcon } from '../../utils/traitIcons';
import { chooseTrait } from '../../services/totem';
import TraitCard from './TraitCard';

interface TraitPickerModalProps {
    totemId: string;
    totemName: string;
    slot: TraitSlot;
    onClose: () => void;
    /** Called after a successful choice — parent should refresh totem state. */
    onChosen: (traitId: string) => void;
}

const SLOT_LABEL: Record<TraitSlot, string> = {
    innate: 'Innate',
    learned: 'Learned',
    awakened: 'Awakened',
};

const SLOT_THEME: Record<TraitSlot, string> = {
    innate: 'It was born with this one — you can\'t pick.',
    learned: 'Choose what your totem has learned. This choice is permanent.',
    awakened: 'Choose what your totem has awakened to. This is the final, defining trait — and it\'s permanent.',
};

const TraitPickerModal: React.FC<TraitPickerModalProps> = ({
    totemId,
    totemName,
    slot,
    onClose,
    onChosen,
}) => {
    const [pending, setPending] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    const traits: TraitDefinition[] = getTraitsBySlot(slot);
    const requireConfirm = slot === 'awakened';

    const submitChoice = async (traitId: string) => {
        if (slot === 'innate') return; // innate isn't selectable
        setPending(traitId);
        setError(null);
        const res = await chooseTrait(totemId, slot, traitId);
        setPending(null);
        if (!res.success) {
            setError(res.error || 'Could not choose this trait. Try again.');
            return;
        }
        onChosen(traitId);
        onClose();
    };

    const handleChoose = (traitId: string) => {
        if (requireConfirm) {
            setConfirmId(traitId);
            return;
        }
        submitChoice(traitId);
    };

    const confirmDef = confirmId ? getTraitById(confirmId) : null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label={`Choose a ${SLOT_LABEL[slot]} trait for ${totemName}`}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="relative w-full max-w-4xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl ring-1 ring-amber-500/30 my-4 sm:my-0">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-stone-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100">
                            Choose a {SLOT_LABEL[slot]} Trait
                        </h2>
                        <p className="text-sm text-stone-600 dark:text-stone-400 mt-1">
                            for <span className="font-medium">{totemName}</span>
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="shrink-0 p-2 rounded-md text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-gray-800 min-h-[44px] min-w-[44px] flex items-center justify-center"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 sm:px-6 py-4 max-h-[70vh] overflow-y-auto">
                    <p className="text-sm text-stone-600 dark:text-stone-300 mb-3">
                        {SLOT_THEME[slot]}
                    </p>
                    {error && (
                        <div className="mb-3 px-3 py-2 rounded-md bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
                            <AlertTriangle size={16} /> {error}
                        </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {traits.map((t) => (
                            <TraitCard
                                key={t.id}
                                trait={t}
                                selectable
                                disabled={pending !== null}
                                onChoose={handleChoose}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-stone-400 dark:text-stone-500 mt-4 italic text-center">
                        Effects coming soon — for now, traits are flavor and identity.
                    </p>
                </div>
            </div>

            {/* Confirm dialog (Awakened only) */}
            {confirmDef && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Confirm trait choice"
                    className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setConfirmId(null); }}
                >
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 max-w-sm w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-3">
                            <TraitIcon traitId={confirmDef.id} size={32} colorBySlot />
                            <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100">
                                Awaken as {confirmDef.name}?
                            </h3>
                        </div>
                        <p className="text-sm text-stone-600 dark:text-stone-300 mb-4">
                            This choice is permanent. Your totem will carry this trait for the rest of its life.
                        </p>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setConfirmId(null)}
                                className="flex-1 px-3 py-2 rounded-md bg-stone-200 dark:bg-gray-700 hover:bg-stone-300 dark:hover:bg-gray-600 text-stone-900 dark:text-stone-100 text-sm font-medium min-h-[44px]"
                            >
                                Not yet
                            </button>
                            <button
                                type="button"
                                onClick={() => { const id = confirmDef.id; setConfirmId(null); submitChoice(id); }}
                                disabled={pending !== null}
                                className="flex-1 px-3 py-2 rounded-md bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 min-h-[44px]"
                            >
                                Awaken
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TraitPickerModal;
