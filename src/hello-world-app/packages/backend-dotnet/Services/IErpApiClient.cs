using HelloWorldApp.Backend.DotNet.Models;

namespace HelloWorldApp.Backend.DotNet.Services;

public interface IErpApiClient
{
    Task<HttpResponseMessage> ForwardAsync(ErpProxyRequest request, string method, CancellationToken cancellationToken);
}
