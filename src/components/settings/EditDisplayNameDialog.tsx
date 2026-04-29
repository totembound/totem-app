import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Sparkles, Clock, CheckCircle } from 'lucide-react';
import apiClient from '../../services/ApiClient';
import { useAuth } from '../../contexts/AuthContext';
import { useUser } from '../../contexts/UserContext';

interface EditDisplayNameDialogProps {
  open: boolean;
  currentName: string;
  cooldown?: { readyAt: string | null; skipCost: number } | null;
  onClose: () => void;
  onSuccess?: (newName: string, skippedCooldown: boolean) => void;
}

const NAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9 _-]*[a-zA-Z0-9])?$/;
const MIN_LEN = 3;
const MAX_LEN = 20;

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'now';
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (days >= 1) return `${days}d ${hours}h`;
  if (hours >= 1) return `${hours}h ${minutes}m`;
  if (minutes >= 1) return `${minutes}m`;
  return 'less than a minute';
}

function clientValidate(name: string, currentName: string): string | null {
  const trimmed = name.trim();
  if (trimmed.length < MIN_LEN || trimmed.length > MAX_LEN) {
    return `Name must be ${MIN_LEN}–${MAX_LEN} characters`;
  }
  if (!NAME_PATTERN.test(trimmed)) {
    return 'Letters, numbers, spaces, hyphens, and underscores only — must start and end with a letter or number';
  }
  if (trimmed.includes('  ')) {
    return 'No consecutive spaces';
  }
  if (trimmed === currentName) {
    return 'New name matches your current name';
  }
  return null;
}

const EditDisplayNameDialog: React.FC<EditDisplayNameDialogProps> = ({
  open,
  currentName,
  cooldown,
  onClose,
  onSuccess,
}) => {
  const { refreshUser } = useAuth();
  const { updateBalances, essenceBalance } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(currentName || '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingSkip, setConfirmingSkip] = useState(false);
  // Live-tick to refresh cooldown countdown without polling the server
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!open) return;
    setName(currentName || '');
    setError(null);
    setConfirmingSkip(false);
  }, [open, currentName]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  // Tick once a minute while a future cooldown is active so the countdown
  // text stays current without server roundtrips.
  useEffect(() => {
    if (!open || !cooldown?.readyAt) return;
    const readyAtMs = new Date(cooldown.readyAt).getTime();
    if (readyAtMs <= Date.now()) return;
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, [open, cooldown?.readyAt]);

  const cooldownState = useMemo(() => {
    const readyAt = cooldown?.readyAt ? new Date(cooldown.readyAt).getTime() : null;
    if (!readyAt || readyAt <= now) return { active: false, remainingMs: 0 } as const;
    return { active: true, remainingMs: readyAt - now } as const;
  }, [cooldown?.readyAt, now]);

  const skipCost = cooldown?.skipCost ?? 500;
  const essenceNumber = Number(essenceBalance ?? 0);
  const canAffordSkip = essenceNumber >= skipCost;
  const localError = clientValidate(name, currentName || '');
  const trimmed = name.trim();
  const submittable = !submitting && !localError;

  const submit = async (skipCooldown: boolean) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.updateDisplayName(trimmed, skipCooldown);
      if (!res.success || !res.data) {
        const code = res.error?.code;
        if (code === 'PROFANITY') {
          setError('Please choose a different name.');
        } else if (code === 'INSUFFICIENT_BALANCE') {
          setError(`You need ${skipCost} Essence to skip the cooldown.`);
        } else if (code === 'COOLDOWN_ACTIVE') {
          setError('This name change is on cooldown.');
        } else {
          setError(res.error?.message || 'Failed to update name.');
        }
        return;
      }
      await refreshUser();
      if (res.data.skippedCooldown) {
        await updateBalances();
      }
      onSuccess?.(res.data.displayName, res.data.skippedCooldown);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to update name.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] bg-white dark:bg-gray-800 sm:bg-transparent sm:dark:bg-transparent sm:flex sm:items-center sm:justify-center sm:p-4">
      <div
        className="hidden sm:block fixed inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => !submitting && onClose()}
      />
      <div
        className="relative w-full h-full sm:h-auto sm:max-w-md sm:max-h-[85vh] bg-white dark:bg-gray-800 sm:rounded-xl shadow-xl flex flex-col overflow-hidden"
        role="dialog"
        aria-label="Edit display name"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit Display Name</h2>
          <button
            onClick={onClose}
            disabled={submitting}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Cooldown banner */}
          {cooldownState.active ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-800 dark:text-amber-200">
              <Clock className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                You can change your name again for free in <strong>{formatRemaining(cooldownState.remainingMs)}</strong>.
                Or pay <strong>{skipCost} Essence</strong> to change it now.
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-sm text-green-800 dark:text-green-200">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>Free change available — your next change will start a 30-day cooldown.</div>
            </div>
          )}

          {/* Input */}
          <div>
            <label htmlFor="displayNameInput" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              New display name
            </label>
            <input
              id="displayNameInput"
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && submittable && !cooldownState.active) {
                  e.preventDefault();
                  submit(false);
                }
              }}
              disabled={submitting}
              maxLength={MAX_LEN}
              className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 dark:focus:border-purple-500 focus:ring-1 focus:ring-purple-500 dark:focus:ring-purple-500 focus:outline-none disabled:opacity-50"
              placeholder="Enter a new display name"
              autoComplete="off"
            />
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className={localError ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}>
                {localError ?? `${MIN_LEN}–${MAX_LEN} characters · letters, numbers, spaces, hyphens, underscores`}
              </span>
              <span className="text-gray-500 dark:text-gray-400 tabular-nums">{name.length}/{MAX_LEN}</span>
            </div>
          </div>

          {/* Server error */}
          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Skip-cooldown confirm */}
          {cooldownState.active && confirmingSkip && (
            <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-sm space-y-2">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
                <Sparkles className="w-4 h-4" />
                <span>Spend <strong>{skipCost} Essence</strong> to change your name now?</span>
              </div>
              <div className="text-xs text-purple-800 dark:text-purple-300">
                Current balance: {essenceNumber.toLocaleString()} Essence
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => submit(true)}
                  disabled={!submittable || !canAffordSkip}
                  className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-900 text-white disabled:cursor-not-allowed min-h-[44px]"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Confirm — ${skipCost} Essence`}
                </button>
                <button
                  onClick={() => setConfirmingSkip(false)}
                  disabled={submitting}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50 min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
              {!canAffordSkip && (
                <div className="text-xs text-red-600 dark:text-red-400">
                  Not enough Essence (need {skipCost}).
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — hidden during the inline skip-cooldown confirm step
            because that card carries its own Confirm/Cancel pair. */}
        {!(cooldownState.active && confirmingSkip) && (
          <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-2 shrink-0">
            {cooldownState.active ? (
              <button
                onClick={() => setConfirmingSkip(true)}
                disabled={!submittable}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-900 text-white disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Change now for {skipCost} Essence
              </button>
            ) : (
              <button
                onClick={() => submit(false)}
                disabled={!submittable}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 dark:disabled:bg-purple-900 text-white disabled:cursor-not-allowed min-h-[44px] flex items-center justify-center"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 disabled:opacity-50 min-h-[44px]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

export default EditDisplayNameDialog;
