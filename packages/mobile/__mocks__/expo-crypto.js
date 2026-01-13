module.exports = {
  getRandomBytesAsync: jest.fn().mockResolvedValue(new Uint8Array(16)),
};
