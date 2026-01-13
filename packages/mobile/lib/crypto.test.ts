import { deriveKey, encryptData, decryptData } from './crypto';
import * as Crypto from 'expo-crypto';

describe('Crypto Lib', () => {
  const password = 'test-password';
  const salt = 'test+salt+base64';

  beforeAll(() => {
    // Ensure Node's crypto is available for subtle
    if (!global.crypto) {
      // @ts-ignore
      global.crypto = require('crypto').webcrypto;
    }
  });

  describe('deriveKey', () => {
    it('should derive a key and salt from password', async () => {
      // Mock getRandomBytesAsync for salt generation
      (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValueOnce(
        new Uint8Array([1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4, 1, 2, 3, 4]),
      );

      const result = await deriveKey(password);

      expect(result.key).toBeDefined();
      expect(result.salt).toBeDefined();
      expect(typeof result.key).toBe('string');
      expect(typeof result.salt).toBe('string');
    });

    it('should derive same key with same salt', async () => {
      const result1 = await deriveKey(password, salt);
      const result2 = await deriveKey(password, salt);

      expect(result1.key).toBe(result2.key);
      expect(result1.salt).toBe(salt);
    });
  });

  describe('encryptData & decryptData', () => {
    it('should encrypt and decrypt data correctly', async () => {
      const { key } = await deriveKey(password);
      const data = 'Secret Message';

      // Mock random bytes for IV
      (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValueOnce(new Uint8Array(12));

      const encrypted = await encryptData(data, key);

      expect(encrypted.cipherText).toBeDefined();
      expect(encrypted.iv).toBeDefined();

      const decrypted = await decryptData(encrypted.cipherText, encrypted.iv, key);

      expect(decrypted).toBe(data);
    });

    it('should fail to decrypt with wrong key', async () => {
      const { key: key1 } = await deriveKey(password);
      const { key: key2 } = await deriveKey('wrong-password');
      const data = 'Secret Message';

      (Crypto.getRandomBytesAsync as jest.Mock).mockResolvedValueOnce(new Uint8Array(12));

      const encrypted = await encryptData(data, key1);

      await expect(decryptData(encrypted.cipherText, encrypted.iv, key2)).rejects.toThrow();
    });
  });
});
