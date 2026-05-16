import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface PortalCoords {
    top: number;
    left: number;
    arrowClass: string;
}

const GAP = 8;

const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'top'
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState<PortalCoords | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    /**
     * Compute fixed-viewport coordinates for the tooltip body, choosing the
     * preferred side first then flipping if it overflows. Rendering via portal
     * to document.body sidesteps ancestor `overflow: hidden` clipping (modal
     * shells, sticky headers, scrollable containers) which broke the previous
     * `position: absolute` implementation.
     */
    const recalculate = useCallback(() => {
        const trigger = triggerRef.current;
        const tooltip = contentRef.current;
        if (!trigger || !tooltip) return;

        const tRect = trigger.getBoundingClientRect();
        const cRect = tooltip.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Try preferred side; flip if it would overflow viewport.
        let chosen = position;
        if (chosen === 'top' && tRect.top - cRect.height - GAP < 0) chosen = 'bottom';
        else if (chosen === 'bottom' && tRect.bottom + cRect.height + GAP > vh) chosen = 'top';
        else if (chosen === 'left' && tRect.left - cRect.width - GAP < 0) chosen = 'right';
        else if (chosen === 'right' && tRect.right + cRect.width + GAP > vw) chosen = 'left';

        let top = 0;
        let left = 0;
        let arrowClass = '';

        switch (chosen) {
            case 'top':
                top = tRect.top - cRect.height - GAP;
                left = tRect.left + tRect.width / 2 - cRect.width / 2;
                arrowClass = 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent';
                break;
            case 'bottom':
                top = tRect.bottom + GAP;
                left = tRect.left + tRect.width / 2 - cRect.width / 2;
                arrowClass = 'top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent';
                break;
            case 'left':
                top = tRect.top + tRect.height / 2 - cRect.height / 2;
                left = tRect.left - cRect.width - GAP;
                arrowClass = 'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent';
                break;
            case 'right':
                top = tRect.top + tRect.height / 2 - cRect.height / 2;
                left = tRect.right + GAP;
                arrowClass = 'left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent';
                break;
        }

        // Clamp horizontally inside the viewport with an 8px breathing margin.
        if (chosen === 'top' || chosen === 'bottom') {
            left = Math.max(8, Math.min(left, vw - cRect.width - 8));
        }
        // Clamp vertically too, for left/right placements.
        if (chosen === 'left' || chosen === 'right') {
            top = Math.max(8, Math.min(top, vh - cRect.height - 8));
        }

        setCoords({ top, left, arrowClass });
    }, [position]);

    // Recompute on visibility, scroll, resize. Scroll listener is on `window`
    // with capture so it catches scroll events from any nested scroller too.
    useEffect(() => {
        if (!isVisible) return;
        recalculate();
        // Two extra rAFs let the portal mount + measure before final position.
        const r1 = requestAnimationFrame(recalculate);
        const r2 = requestAnimationFrame(() => requestAnimationFrame(recalculate));
        const onScrollResize = () => recalculate();
        window.addEventListener('scroll', onScrollResize, true);
        window.addEventListener('resize', onScrollResize);
        return () => {
            cancelAnimationFrame(r1);
            cancelAnimationFrame(r2);
            window.removeEventListener('scroll', onScrollResize, true);
            window.removeEventListener('resize', onScrollResize);
        };
    }, [isVisible, recalculate]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div
            ref={triggerRef}
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
            onClick={() => setIsVisible(!isVisible)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    setIsVisible(!isVisible);
                }
            }}
        >
            {children}
            {isVisible && createPortal(
                <div
                    ref={contentRef}
                    style={{
                        position: 'fixed',
                        top: coords?.top ?? -9999,
                        left: coords?.left ?? -9999,
                        zIndex: 9999,
                        pointerEvents: 'none',
                    }}
                    className={`transition-opacity duration-200 ${coords ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="relative">
                        <div className="
                            bg-gray-900 dark:bg-gray-700
                            text-white px-2 py-1
                            rounded text-sm
                            whitespace-normal
                            max-w-[320px] min-w-[120px]
                            text-center
                        ">
                            {content}
                        </div>
                        {coords && (
                            <div
                                className={`
                                    absolute w-2 h-2
                                    border-4 border-gray-900 dark:border-gray-700
                                    bg-gray-900 dark:bg-gray-700
                                    rotate-45 transform
                                    ${coords.arrowClass}
                                `}
                            />
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default Tooltip;
