/**
 * Format utilities - Web2 version (whole integer amounts, no wei conversion)
 */

/**
 * Format a token amount to human readable string with locale formatting
 * @param value - Integer amount as string or number
 */
export const formatTokenAmount = (value: string | number): string => {
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (isNaN(numValue)) return '0';
    return numValue.toLocaleString();
};

const compactFormatter = new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1,
});

export const formatCompact = (value: string | number): string => {
    const numValue = typeof value === 'string' ? Number(value) : value;
    if (isNaN(numValue)) return '0';
    return compactFormatter.format(numValue);
};

/**
 * Parse a human readable amount to integer
 * @param value - Human readable value
 */
export const parseTokenAmount = (value: string | number): number => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return Math.floor(numValue);
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

export const formatHoursDuration = (durationHours: number): string => {
    if (durationHours < 1) {
        const minutes = Math.round(durationHours * 60);
        return `${minutes} minutes`;
    } else if (durationHours === 1) {
        return '1 hour';
    } else {
        return `${durationHours} hours`;
    }
};
