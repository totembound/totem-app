import { ethers } from 'ethers';

export const formatTokenAmount = (value: string): string => {
    const formatted = ethers.formatEther(value);
    // Check if the value is a whole number
    if (formatted.endsWith('.0') || formatted.includes('.000')) {
        // Remove trailing zeros and decimal point if it's a whole number
        return parseFloat(formatted).toString();
    }
    return formatted;
};

export const formatTimeRemaining = (endTime: number): string => {
    const now = Math.floor(Date.now() / 1000);
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return 'Completed';
    
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    
    return `${hours}h ${minutes}m remaining`;
};

export const splitWords = (text: string): string => {
    // Split words and add spaces between them
    return text.replace(/([A-Z])/g, ' $1').trim();
};

export const formatExpeditionDuration = (durationHours: number): string => {
    if (durationHours < 1) {
        const minutes = Math.round(durationHours * 60);
        return `${minutes} minutes`;
    } else if (durationHours === 1) {
        return '1 hour';
    } else {
        return `${durationHours} hours`;
    }
};