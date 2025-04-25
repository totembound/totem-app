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