// Jest Setup
// import 'react-native-gesture-handler/jestSetup'; // Commenting out to isolate issue

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(16)), // Mock 16 bytes
}));

// Mock Web Crypto API if needed (though Node 20 usually has it)
if (!global.crypto) {
  // @ts-ignore
  global.crypto = require('crypto').webcrypto;
}
