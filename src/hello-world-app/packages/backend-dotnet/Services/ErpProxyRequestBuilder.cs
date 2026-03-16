using System.Text.Json.Nodes;
using HelloWorldApp.Backend.DotNet.Models;

namespace HelloWorldApp.Backend.DotNet.Services;

public static class ErpProxyRequestBuilder
{
    public static async Task<ErpProxyRequest> BuildAsync(
        HttpRequest request,
        string tenantId,
        string endpoint,
        CancellationToken cancellationToken)
    {
        if (!SupportsBody(request.Method))
        {
            return new ErpProxyRequest(tenantId, endpoint, null);
        }

        var requestBody = await request.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);

        if (requestBody is not JsonObject jsonObject)
        {
            return new ErpProxyRequest(tenantId, endpoint, requestBody);
        }

        var nextTenantId = jsonObject["_tenantId"]?.GetValue<string>() ?? tenantId;
        var nextEndpoint = jsonObject["_endpoint"]?.GetValue<string>() ?? endpoint;
        var cleanedBody = new JsonObject();

        foreach (var property in jsonObject)
        {
            if (property.Key is "_tenantId" or "_endpoint")
            {
                continue;
            }

            cleanedBody[property.Key] = property.Value?.DeepClone();
        }

        return new ErpProxyRequest(nextTenantId, nextEndpoint, cleanedBody);
    }

    private static bool SupportsBody(string method)
    {
        return method is "POST" or "PUT" or "PATCH";
    }
}
