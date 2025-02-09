import React from 'react';

export const Feature: React.FC<{ 
    icon: string; 
    text: React.ReactNode;
    large?: boolean;
}> = ({ icon, text, large }) => (
    <div className="flex items-start gap-3">
        <span className={`${large ? 'text-xl' : 'text-lg'} mt-1`}>{icon}</span>
        <p className={`${large ? 'text-xl' : 'text-base md:text-lg'} text-gray-700 dark:text-gray-300`}>
            {text}
        </p>
    </div>
);