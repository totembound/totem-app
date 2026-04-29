import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Trash2 } from 'lucide-react';
import { AvatarRef, BannerRef, Domain, TotemData } from '../../types/types';
import { DOMAINS } from '../../config/game-config';
import { getTotemImageUrl, getStageName } from '../../utils/species';

type Mode = 'avatar' | 'banner';

interface AvatarModeProps {
    isOpen: boolean;
    mode: 'avatar';
    current: AvatarRef;
    totems: TotemData[];
    onClose: () => void;
    onSave: (ref: AvatarRef) => void | Promise<void>;
}

interface BannerModeProps {
    isOpen: boolean;
    mode: 'banner';
    current: BannerRef;
    onClose: () => void;
    onSave: (ref: BannerRef) => void | Promise<void>;
}

type ImagePickerDialogProps = AvatarModeProps | BannerModeProps;

function refsEqual(a: AvatarRef | BannerRef, b: AvatarRef | BannerRef): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (a.kind !== b.kind) return false;
    if (a.kind === 'domain' && b.kind === 'domain') return a.id === b.id;
    if (a.kind === 'totem' && b.kind === 'totem') {
        return a.speciesId === b.speciesId && a.colorId === b.colorId && a.stage === b.stage;
    }
    return false;
}

export function ImagePickerDialog(props: ImagePickerDialogProps) {
    const { isOpen, mode, onClose } = props;
    const [tab, setTab] = useState<'domains' | 'totems'>('domains');
    const [selected, setSelected] = useState<AvatarRef | BannerRef>(props.current);
    const [expandedTotemId, setExpandedTotemId] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setSelected(props.current);
        setTab('domains');
        setExpandedTotemId(null);
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', onKey);
        };
    }, [isOpen, props.current, onClose]);

    if (!isOpen) return null;

    const dirty = !refsEqual(selected, props.current);

    const handleSave = async () => {
        setSaving(true);
        try {
            // In banner mode the picker only ever sets domain refs (the totem tab
            // is hidden), so the runtime shape always satisfies BannerRef. Cast
            // is needed because the union state is wider than each callback.
            if (props.mode === 'banner') {
                await props.onSave(selected as BannerRef);
            }
            else {
                await props.onSave(selected as AvatarRef);
            }
            onClose();
        }
        finally {
            setSaving(false);
        }
    };

    const handleClear = () => setSelected(null);

    const totems = mode === 'avatar' ? props.totems : [];
    const showTabs = mode === 'avatar';

    const isDomainSelected = (id: number) =>
        selected !== null && selected.kind === 'domain' && selected.id === id;

    const isTotemStageSelected = (speciesId: number, colorId: number, stage: number) =>
        selected !== null && selected.kind === 'totem'
        && selected.speciesId === speciesId && selected.colorId === colorId && selected.stage === stage;

    return createPortal(
        <div
            className="fixed inset-0 z-[60] bg-white dark:bg-gray-800 sm:bg-transparent sm:dark:bg-transparent sm:flex sm:items-center sm:justify-center sm:p-4"
            role="dialog"
            aria-modal="true"
            aria-label={mode === 'avatar' ? 'Choose avatar' : 'Choose banner'}
        >
            <div
                className="hidden sm:block fixed inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative w-full h-full sm:h-auto sm:max-w-2xl sm:max-h-[85vh] bg-white dark:bg-gray-800 sm:rounded-xl shadow-xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex-shrink-0 flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                        {mode === 'avatar' ? 'Choose Avatar' : 'Choose Banner'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Tabs (avatar mode only) */}
                {showTabs && (
                    <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 flex">
                        <TabButton active={tab === 'domains'} onClick={() => setTab('domains')}>
                            Domains
                        </TabButton>
                        <TabButton active={tab === 'totems'} onClick={() => setTab('totems')}>
                            My Totems
                        </TabButton>
                    </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4">
                    {(!showTabs || tab === 'domains') && (
                        <div className={mode === 'banner'
                            ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                            : 'grid grid-cols-2 sm:grid-cols-3 gap-3'}
                        >
                            {DOMAINS.map(d => (
                                <DomainTile
                                    key={d.id}
                                    name={d.name}
                                    image={d.image}
                                    aspect={mode === 'banner' ? 'banner' : 'square'}
                                    selected={isDomainSelected(d.id)}
                                    onClick={() => setSelected({ kind: 'domain', id: d.id as Domain })}
                                />
                            ))}
                        </div>
                    )}

                    {mode === 'avatar' && tab === 'totems' && (
                        <div className="space-y-2">
                            {totems.length === 0 && (
                                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">
                                    You don't own any totems yet.
                                </p>
                            )}
                            {totems.map(t => (
                                <TotemRow
                                    key={t.id}
                                    totem={t}
                                    expanded={expandedTotemId === t.id}
                                    onToggle={() => setExpandedTotemId(expandedTotemId === t.id ? null : t.id)}
                                    isStageSelected={(stage) => isTotemStageSelected(
                                        t.attributes.species,
                                        t.attributes.color,
                                        stage,
                                    )}
                                    onPickStage={(stage) => setSelected({
                                        kind: 'totem',
                                        speciesId: t.attributes.species,
                                        colorId: t.attributes.color,
                                        stage,
                                    })}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex-shrink-0 flex items-center justify-between gap-2 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClear}
                        disabled={selected === null || saving}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 disabled:hover:bg-transparent"
                    >
                        <Trash2 className="w-4 h-4" />
                        {mode === 'avatar' ? 'Remove avatar' : 'Remove banner'}
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!dirty || saving}
                            className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40"
                        >
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body,
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                active
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
        >
            {children}
        </button>
    );
}

function DomainTile({
    name, image, selected, onClick, aspect,
}: {
    name: string;
    image: string;
    selected: boolean;
    onClick: () => void;
    aspect: 'square' | 'banner';
}) {
    const aspectClass = aspect === 'banner' ? 'aspect-[3/1]' : 'aspect-square';
    return (
        <button
            onClick={onClick}
            className={`relative ${aspectClass} rounded-lg overflow-hidden ring-2 transition-all ${
                selected
                    ? 'ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                    : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'
            }`}
            aria-pressed={selected}
        >
            <img src={image} alt={name} className="w-full h-full object-cover" loading="lazy" />
            <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent text-white text-sm font-medium px-2 py-1 text-left">
                {name}
            </span>
        </button>
    );
}

function TotemRow({
    totem, expanded, onToggle, isStageSelected, onPickStage,
}: {
    totem: TotemData;
    expanded: boolean;
    onToggle: () => void;
    isStageSelected: (stage: number) => boolean;
    onPickStage: (stage: number) => void;
}) {
    const currentStage = totem.attributes.stage ?? 0;
    const speciesId = totem.attributes.species;
    const colorId = totem.attributes.color;
    const stages = Array.from({ length: currentStage + 1 }, (_, i) => i);
    const headerImage = getTotemImageUrl(speciesId, colorId, currentStage);

    return (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700">
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-2 sm:p-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg"
            >
                <img
                    src={headerImage}
                    alt={totem.displayName}
                    className="w-12 h-12 rounded-md object-cover"
                    loading="lazy"
                />
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {totem.attributes.nickname || totem.displayName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Stage {currentStage} · {stages.length} {stages.length === 1 ? 'image' : 'images'}
                    </p>
                </div>
                <span className="text-xs text-gray-400">{expanded ? '▾' : '▸'}</span>
            </button>
            {expanded && (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 p-2 sm:p-3 pt-0">
                    {stages.map(stage => {
                        const src = getTotemImageUrl(speciesId, colorId, stage);
                        const selected = isStageSelected(stage);
                        return (
                            <button
                                key={stage}
                                onClick={() => onPickStage(stage)}
                                className={`relative aspect-square rounded-md overflow-hidden ring-2 transition-all ${
                                    selected
                                        ? 'ring-indigo-500 ring-offset-1 ring-offset-white dark:ring-offset-gray-800'
                                        : 'ring-transparent hover:ring-gray-300 dark:hover:ring-gray-600'
                                }`}
                                aria-pressed={selected}
                            >
                                <img src={src} alt={`Stage ${stage}`} className="w-full h-full object-cover" loading="lazy" />
                                <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] py-0.5 text-center">
                                    {getStageName(speciesId, colorId, stage)}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
