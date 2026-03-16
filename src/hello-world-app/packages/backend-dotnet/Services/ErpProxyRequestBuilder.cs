using System.Text.Json.Nodes;
using HelloWorldApp.Backend.DotNet.Models;

namespace HelloWorldApp.Backend.DotNet.Services;

public static class ErpProxyRequestBuilder
{
    public static async Task<ErpProxyRequest> BuildAsync(
        HttpRequest request,
        string endpoint,
        CancellationToken cancellationToken)
    {
        if (!SupportsBody(request.Method))
        {
            return new ErpProxyRequest(endpoint, null);
        }

        var requestBody = await request.ReadFromJsonAsync<JsonNode>(cancellationToken: cancellationToken);
        return new ErpProxyRequest(endpoint, requestBody);
    }

    private static bool SupportsBody(string method)
    {
        return method is "POST" or "PUT" or "PATCH";
    }
}
