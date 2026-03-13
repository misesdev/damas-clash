export const bech32 = {
  decode: jest.fn().mockReturnValue({ prefix: 'nsec', words: new Array(52).fill(0) }),
  encode: jest.fn().mockReturnValue('npub1test000000000000000000000000000000000000000000000000testtest'),
  fromWords: jest.fn().mockReturnValue(new Array(32).fill(0)),
  toWords: jest.fn().mockReturnValue(new Array(52).fill(0)),
};
