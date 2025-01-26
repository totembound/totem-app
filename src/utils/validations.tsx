export const validateDisplayName = (name: string): { valid: boolean; error?: string } => {
    if (!name) return { valid: false, error: 'Name required' };
    if (name.length < 1 || name.length > 32) return { valid: false, error: 'Name must be 1-32 characters' };
    
    const regex = /^[\p{L}\p{N}\p{P}\p{Z}]+$/u;
    if (!regex.test(name)) return { valid: false, error: 'Contains invalid characters' };
    
    return { valid: true };
};
