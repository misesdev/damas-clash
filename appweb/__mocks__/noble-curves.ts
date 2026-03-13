export const schnorr = {
  sign: jest.fn().mockReturnValue(new Uint8Array(64)),
  verify: jest.fn().mockReturnValue(true),
};
export const secp256k1 = {
  getPublicKey: jest.fn().mockReturnValue(new Uint8Array(33)),
};
