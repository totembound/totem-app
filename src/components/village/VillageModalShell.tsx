import React, { useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { AtmosphereInput, resolveAtmosphere, useAtmosphere } from './atmosphere';

interface VillageModalShellProps {
  /** Atmosphere preset name or full ModalAtmosphere object. Default 'soft'. */
  atmosphere?: AtmosphereInput;
  /** Accessible label for the dialog. */
  modalTitle?: string;
  /** Modal content. If omitted, renders <Outlet /> so the shell can be used as
   *  a layout route for nested modal subtrees (e.g. guides with codex nesting).
   *  Using as a layout keeps the shell mounted across sub-navigation, so
   *  atmosphere doesn't toggle and the user stays "inside" the building. */
  children?: React.ReactNode;
}

const VillageModalShell: React.FC<VillageModalShellProps> = ({
  atmosphere,
  modalTitle,
  children,
}) => {
  const navigate = useNavigate();
  const { set, clear } = useAtmosphere();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    set(resolveAtmosphere(atmosphere));
    return clear;
  }, [atmosphere, set, clear]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        navigate('/keepers-village');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const onBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) navigate('/keepers-village');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={modalTitle ?? 'Village modal'}
      onClick={onBackdropClick}
      className="fixed inset-0 z-40 bg-slate-950/85 flex items-stretch sm:items-center justify-center p-0 sm:p-6 md:p-10"
    >
      <div className="relative w-full sm:w-[95vw] sm:max-w-7xl h-full sm:h-auto sm:max-h-[90vh] bg-white dark:bg-gray-900 sm:rounded-xl shadow-2xl ring-1 ring-amber-500/30 flex flex-col overflow-hidden">
        {/* Modal chrome — own header bar so the close button never collides
            with right-aligned controls in the leaf (e.g. Achievements'
            "Collapse All", Shop's filter row, Codex tabs). Leaf content
            below gets the full width. */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/60">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-gray-100 truncate">
            {modalTitle ?? 'Village'}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => navigate('/keepers-village')}
            aria-label="Close"
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-amber-100 dark:hover:bg-gray-700 ring-1 ring-gray-300 dark:ring-gray-600 hover:ring-amber-400 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">{children ?? <Outlet />}</div>
      </div>
    </div>
  );
};

export default VillageModalShell;
