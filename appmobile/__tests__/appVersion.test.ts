import {isVersionOutdated} from '../src/api/appVersion';

describe('isVersionOutdated', () => {
  it('returns false when current equals required', () => {
    expect(isVersionOutdated('2.7', '2.7')).toBe(false);
  });

  it('returns false when current is newer (minor)', () => {
    expect(isVersionOutdated('2.8', '2.7')).toBe(false);
  });

  it('returns false when current is newer (major)', () => {
    expect(isVersionOutdated('3.0', '2.7')).toBe(false);
  });

  it('returns true when current is older (minor)', () => {
    expect(isVersionOutdated('2.6', '2.7')).toBe(true);
  });

  it('returns true when current is older (major)', () => {
    expect(isVersionOutdated('1.9', '2.0')).toBe(true);
  });

  it('handles 3-part versions', () => {
    expect(isVersionOutdated('2.7.0', '2.7.1')).toBe(true);
    expect(isVersionOutdated('2.7.1', '2.7.0')).toBe(false);
    expect(isVersionOutdated('2.7.1', '2.7.1')).toBe(false);
  });

  it('handles minor version ≥ 10', () => {
    expect(isVersionOutdated('2.9', '2.10')).toBe(true);
    expect(isVersionOutdated('2.10', '2.9')).toBe(false);
  });
});
