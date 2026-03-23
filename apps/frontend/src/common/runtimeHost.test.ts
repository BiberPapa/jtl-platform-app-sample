import { describe, expect, it } from 'vitest';
import { isRunningOnJtlCloudDomain } from './runtimeHost';

describe('isRunningOnJtlCloudDomain', () => {
  it('returns true for jtl cloud domains', () => {
    expect(isRunningOnJtlCloudDomain('jtl-cloud.com')).toBe(true);
    expect(isRunningOnJtlCloudDomain('hub.jtl-cloud.com')).toBe(true);
    expect(isRunningOnJtlCloudDomain('erp.qa.jtl-cloud.com')).toBe(true);
  });

  it('returns false outside jtl cloud domains', () => {
    expect(isRunningOnJtlCloudDomain('localhost')).toBe(false);
    expect(isRunningOnJtlCloudDomain('127.0.0.1')).toBe(false);
    expect(isRunningOnJtlCloudDomain('example.com')).toBe(false);
  });
});
