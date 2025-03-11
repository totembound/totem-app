/**
 * Creates a prefixed key unique to the user address
 * @param baseKey The base storage key
 * @param address The user's Ethereum address
 * @returns A unique storage key
 */
export const createUserKey = (baseKey: string, address: string | null): string => {
  if (!address) return baseKey;

  // Normalize the address to ensure consistency
  const normalizedAddress = address.toLowerCase();
  return `${baseKey}_${normalizedAddress}`;
};

/**
 * Get data from localStorage with user-specific key
 * @param baseKey The base storage key
 * @param address The user's Ethereum address
 * @param defaultValue Default value if nothing is stored
 * @returns The stored data or default value
 */
export const getUserStorage = <T>(
  baseKey: string,
  address: string | null,
  defaultValue: T
): T => {
  try {
    const userKey = createUserKey(baseKey, address);
    const storedData = localStorage.getItem(userKey);

    if (storedData === null) return defaultValue;
    return JSON.parse(storedData) as T;
  }
  catch (error) {
    console.error(`Error getting data from localStorage (${baseKey}):`, error);
    return defaultValue;
  }
};

/**
 * Set data in localStorage with user-specific key
 * @param baseKey The base storage key
 * @param address The user's Ethereum address
 * @param data The data to store
 */
export const setUserStorage = <T>(
  baseKey: string,
  address: string | null,
  data: T
): void => {
  try {
    const userKey = createUserKey(baseKey, address);
    localStorage.setItem(userKey, JSON.stringify(data));
  }
  catch (error) {
    console.error(`Error setting data in localStorage (${baseKey}):`, error);
  }
};

/**
 * Remove data from localStorage with user-specific key
 * @param baseKey The base storage key
 * @param address The user's Ethereum address
 */
export const removeUserStorage = (baseKey: string, address: string | null): void => {
  try {
    const userKey = createUserKey(baseKey, address);
    localStorage.setItem(userKey, '');
    localStorage.removeItem(userKey);
  }
  catch (error) {
    console.error(`Error removing data from localStorage (${baseKey}):`, error);
  }
};