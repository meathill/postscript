import * as Crypto from 'expo-crypto';
import { Buffer } from 'buffer';

// Polyfill for Buffer
if (typeof global.Buffer === 'undefined') {
  (global as any).Buffer = Buffer;
}

const ITERATIONS = 100000;
const SALT_SIZE = 16;
const KEY_LENGTH = 256; // bits

export async function deriveKey(password: string, salt?: string): Promise<{ key: string; salt: string }> {
  const saltBytes = salt ? Buffer.from(salt, 'base64') : Buffer.from(await Crypto.getRandomBytesAsync(SALT_SIZE));

  // Note: expo-crypto doesn't support PBKDF2 directly in valid algorithm list for digest?
  // Actually expo-crypto only supports SHA digests.
  // For PBKDF2, we might need a JS implementation or 'subtle' crypto if available in Hermes.
  // Hermes has limited Crypto support.
  // However, modern React Native often polyfills web crypto.

  // Implementation note:
  // If `crypto.subtle` is available (it is in recent RN/Expo versions), we use it.
  // Otherwise we might need a library like `react-native-quick-crypto` or `pbkdf2`.
  // Given user didn't ask for extra libs, let's try standard Web Crypto API if available.

  if (global.crypto?.subtle) {
    const encoder = new TextEncoder();
    const keyMaterial = await global.crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey'],
    );

    const key = await global.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBytes,
        iterations: ITERATIONS,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: KEY_LENGTH },
      true,
      ['encrypt', 'decrypt'],
    );

    const exportedKey = await global.crypto.subtle.exportKey('raw', key);
    return {
      key: Buffer.from(exportedKey).toString('base64'),
      salt: saltBytes.toString('base64'),
    };
  } else {
    throw new Error('Web Crypto API not available. Please install a polyfill.');
    // In a real app we would install `react-native-quick-crypto`.
    // But let's assume standard crypto is available or we stub it for now until verified.
  }
}

export async function encryptData(data: string, keyBase64: string): Promise<{ cipherText: string; iv: string }> {
  // Use expo-crypto for random bytes
  const iv = await Crypto.getRandomBytesAsync(12);
  const ivBuffer = Buffer.from(iv);

  if (global.crypto?.subtle) {
    const keyBuffer = Buffer.from(keyBase64, 'base64');
    const key = await global.crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['encrypt']);

    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);

    const encrypted = await global.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      key,
      encodedData,
    );

    return {
      cipherText: Buffer.from(encrypted).toString('base64'),
      iv: ivBuffer.toString('base64'),
    };
  }

  throw new Error('Web Crypto API not available');
}

export async function decryptData(cipherTextBase64: string, ivBase64: string, keyBase64: string): Promise<string> {
  if (global.crypto?.subtle) {
    const keyBuffer = Buffer.from(keyBase64, 'base64');
    const key = await global.crypto.subtle.importKey('raw', keyBuffer, { name: 'AES-GCM' }, false, ['decrypt']);

    const iv = Buffer.from(ivBase64, 'base64');
    const cipherText = Buffer.from(cipherTextBase64, 'base64');

    const decrypted = await global.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      key,
      cipherText,
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  throw new Error('Web Crypto API not available');
}
