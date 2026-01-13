/**
 * 加密模块统一导出
 */

export { arrayBufferToBase64, arrayBufferToString, base64ToArrayBuffer, stringToArrayBuffer } from './encoding';
export { decryptAesGcm, encryptAesGcm, exportKey, generateDEK, generateIV, importAesKey } from './aes-gcm';
export { deriveKEK, generateSalt } from './hkdf';
export { envelopeDecrypt, envelopeEncrypt } from './envelope';
export type { EncryptedPayload } from './envelope';
