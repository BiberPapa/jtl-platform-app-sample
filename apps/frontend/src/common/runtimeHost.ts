export function isRunningOnJtlCloudDomain(hostname = window.location.hostname): boolean {
  return hostname === 'jtl-cloud.com' || hostname.endsWith('.jtl-cloud.com');
}
