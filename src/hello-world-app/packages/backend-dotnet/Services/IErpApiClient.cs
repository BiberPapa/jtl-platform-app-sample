using HelloWorldApp.Backend.DotNet.Models;

namespace HelloWorldApp.Backend.DotNet.Services;

public interface IErpApiClient
{
    Task<HttpResponseMessage> ForwardAsync(ErpProxyRequest request, string tenantId, string method, CancellationToken cancellationToken);
}
