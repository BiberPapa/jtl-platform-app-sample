using System.Collections.Concurrent;

namespace HelloWorldApp.Backend.DotNet.Services;

public sealed class InMemoryTenantMappingStore : ITenantMappingStore
{
    private readonly ConcurrentDictionary<string, string> _tenantMappings = new();

    public void Save(string tenantId, string platformTenantId)
    {
        _tenantMappings[tenantId] = platformTenantId;
    }
}
