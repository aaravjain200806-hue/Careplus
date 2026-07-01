import CryptoJS from 'crypto-js';

const SECRET_KEY = (import.meta.env && import.meta.env.VITE_SECURITY_SECRET) || 'careplus_secure_super_secret_key_2026_abdm';

export const encryptData = (data: string): string => {
  return CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
};

export const decryptData = (ciphertext: string): string | null => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    return decryptedText || null;
  } catch (error) {
    console.error("Decryption failed", error);
    return null;
  }
};

export const secureStorage = {
  getItem: (key: string): string | null => {
    const value = localStorage.getItem(key);
    if (!value) return null;
    
    // Check if the value is raw JSON/plaintext (for backward compatibility / fallback)
    if (value.startsWith('{') || value.startsWith('[') || value === 'true' || value === 'false') {
      return value;
    }
    
    // If it looks like raw number, also return directly
    if (/^\d+$/.test(value)) {
      return value;
    }
    
    const decrypted = decryptData(value);
    return decrypted !== null ? decrypted : value;
  },
  setItem: (key: string, value: string): void => {
    const encrypted = encryptData(value);
    localStorage.setItem(key, encrypted);
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
  }
};
