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
    const tooltipRef = useRef<HTMLDivElement>(null);

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
            onClick={() => setIsVisible(!isVisible)} // Toggle on click
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
                className={`
                    absolute z-50
                    ${positionClasses[position]}
                    ${isVisible ? 'opacity-100 visible' : 'opacity-0 invisible'}
                    transition-opacity duration-200
                `}
            >
                <div className="relative">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded text-sm whitespace-nowrap">
                        {content}
                    </div>
                    <div 
                        className={`
                            absolute w-2 h-2 border-4 border-gray-900 dark:border-gray-700
                            rotate-45 transform
                            ${arrowClasses[position]}
                        `}
                    />
                </div>
            </div>
        </div>
    );
};

export default Tooltip;