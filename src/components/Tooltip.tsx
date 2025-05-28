import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<TooltipProps> = ({ 
    content, 
    children, 
    position = 'top' 
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [computedPosition, setComputedPosition] = useState(position);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const positionClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2 mb-2',
        bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-2 mt-2',
        left: 'right-full top-1/2 -translate-y-1/2 -translate-x-2 mr-2',
        right: 'left-full top-1/2 -translate-y-1/2 translate-x-2 ml-2'
    };

    const arrowClasses = {
        top: 'bottom-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
        bottom: 'top-[-4px] left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
        left: 'right-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
        right: 'left-[-4px] top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent'
    };

    useEffect(() => {
        const calculatePosition = () => {
            if (!isVisible || !tooltipRef.current || !contentRef.current) return;

            const tooltipRect = tooltipRef.current.getBoundingClientRect();
            const contentRect = contentRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let newPosition = position;

            // Check if tooltip would overflow
            const overflow = {
                top: contentRect.top < 0,
                bottom: contentRect.bottom > viewportHeight,
                left: contentRect.left < 0,
                right: contentRect.right > viewportWidth
            };

            // Adjust position based on overflow
            switch (position) {
                case 'top':
                    if (overflow.top) newPosition = 'bottom';
                    break;
                case 'bottom':
                    if (overflow.bottom) newPosition = 'top';
                    break;
                case 'left':
                    if (overflow.left) newPosition = 'right';
                    break;
                case 'right':
                    if (overflow.right) newPosition = 'left';
                    break;
            }

            // Handle horizontal centering and bounds
            if ((newPosition === 'top' || newPosition === 'bottom') && contentRef.current) {
                const contentWidth = contentRef.current.offsetWidth;
                const tooltipCenter = tooltipRect.left + (tooltipRect.width / 2);
                
                if (tooltipCenter - (contentWidth / 2) < 20) {
                    contentRef.current.style.transform = `translateX(${-tooltipCenter + 20}px)`;
                } else if (tooltipCenter + (contentWidth / 2) > viewportWidth - 20) {
                    contentRef.current.style.transform = `translateX(${-(contentWidth - (viewportWidth - tooltipCenter) + 20)}px)`;
                } else {
                    contentRef.current.style.transform = '';
                }
            }

            setComputedPosition(newPosition);
        };

        calculatePosition();
        window.addEventListener('resize', calculatePosition);
        return () => window.removeEventListener('resize', calculatePosition);
    }, [isVisible, position]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsVisible(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div 
            ref={tooltipRef}
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
            <div 
                ref={contentRef}
                className={`
                    absolute z-[9999]
                    ${positionClasses[computedPosition]}
                    ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}
                    transition-opacity duration-200
                    pointer-events-none
                `}
            >
                <div className="relative">
                    <div className="
                        bg-gray-900 dark:bg-gray-700 
                        text-white px-3 py-1.5 
                        rounded text-sm 
<<<<<<< HEAD
                        whitespace-normal
                        max-w-[320px]
=======
                        whitespace-nowrap
                        min-w-[200px] max-w-[320px]
>>>>>>> develop
                        text-center
                    ">
                        {content}
                    </div>
                    <div 
                        className={`
                            absolute w-2 h-2 
                            border-4 border-gray-900 dark:border-gray-700
                            bg-gray-900 dark:bg-gray-700 // Add this line
                            rotate-45 transform
                            ${arrowClasses[computedPosition]}
                        `}
                    />
                </div>
            </div>
        </div>
    );
};

export default Tooltip;