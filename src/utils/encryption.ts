/**
 * Simple XOR encryption for storing Supabase credentials
 * Note: This is better than plaintext but not cryptographically secure.
 * For production, consider using a proper encryption library.
 */

const getMachineKey = (): string => {
  if (typeof window !== 'undefined') {
    // Use screen dimensions only — stable across Electron version upgrades
    return `diffking-${window.screen.width}-${window.screen.height}-jobtracker`;
  }
  return 'default-key';
};

export const encrypt = (text: string): string => {
  if (!text) return '';

  const key = getMachineKey();
  const encrypted = text
    .split('')
    .map((char, i) =>
      String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    )
    .join('');

  return btoa(encrypted);
};

export const decrypt = (encoded: string): string => {
  if (!encoded) return '';

  try {
    const key = getMachineKey();
    const decoded = atob(encoded);
    return decoded
      .split('')
      .map((char, i) =>
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
      )
      .join('');
  } catch (error) {
    console.error('Failed to decrypt:', error);
    return '';
  }
};
