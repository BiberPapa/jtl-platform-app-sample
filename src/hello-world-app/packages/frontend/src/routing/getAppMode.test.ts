import { describe, expect, it } from 'vitest';
import { getAppMode } from './getAppMode';

describe('getAppMode', () => {
  it('returns a supported mode for known paths', () => {
    expect(getAppMode('/setup')).toBe('setup');
    expect(getAppMode('/erp/')).toBe('erp');
    expect(getAppMode('/pane')).toBe('pane');
  });

  it('returns null for unsupported or empty paths', () => {
    expect(getAppMode('/')).toBeNull();
    expect(getAppMode('/unknown')).toBeNull();
    expect(getAppMode('')).toBeNull();
  });
});
