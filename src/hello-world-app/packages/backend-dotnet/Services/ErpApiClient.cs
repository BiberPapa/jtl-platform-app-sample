using System.Net.Http.Headers;
using System.Text;
using HelloWorldApp.Backend.DotNet.Models;

namespace HelloWorldApp.Backend.DotNet.Services;

public sealed class ErpApiClient(HttpClient httpClient, IJtlAuthService authService) : IErpApiClient
{
    public async Task<HttpResponseMessage> ForwardAsync(ErpProxyRequest request, string tenantId, string method, CancellationToken cancellationToken)
    {
        var jwt = await authService.GetJwtAsync(cancellationToken);
        var environmentSuffix = BackendEnvironment.GetApiEnvironmentSuffix(Environment.GetEnvironmentVariable("API_ENVIRONMENT"));
        using var outboundRequest = new HttpRequestMessage(new HttpMethod(method), $"https://api{environmentSuffix}.jtl-cloud.com/erp/{request.Endpoint}");
        outboundRequest.Headers.Add("X-Tenant-ID", tenantId);
        outboundRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", jwt);

        if (request.Body is not null && method is "POST" or "PUT" or "PATCH")
        {
            outboundRequest.Content = new StringContent(request.Body.ToJsonString(), Encoding.UTF8, "application/json");
        }

        return await httpClient.SendAsync(outboundRequest, cancellationToken);
    }
}
