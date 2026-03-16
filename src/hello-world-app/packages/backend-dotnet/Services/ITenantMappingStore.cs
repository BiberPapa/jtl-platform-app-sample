namespace HelloWorldApp.Backend.DotNet.Services;

public interface ITenantMappingStore
{
    void Save(string tenantId, string platformTenantId);
}
