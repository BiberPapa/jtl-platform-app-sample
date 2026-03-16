using System.Text;
using System.Text.Json.Nodes;
using HelloWorldApp.Backend.DotNet.Services;
using Microsoft.AspNetCore.Http;

namespace HelloWorldApp.Backend.DotNet.Tests;

public sealed class ErpProxyRequestBuilderTests
{
    [Fact]
    public async Task BuildAsync_UsesRouteValuesForMethodsWithoutBody()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = HttpMethods.Get;

        var proxyRequest = await ErpProxyRequestBuilder.BuildAsync(
            httpContext.Request,
            "tenant-from-route",
            "customers",
            CancellationToken.None);

        Assert.Equal("tenant-from-route", proxyRequest.TenantId);
        Assert.Equal("customers", proxyRequest.Endpoint);
        Assert.Null(proxyRequest.Body);
    }

    [Fact]
    public async Task BuildAsync_UsesBodyOverridesAndRemovesTransportFields()
    {
        var httpContext = new DefaultHttpContext();
        httpContext.Request.Method = HttpMethods.Post;
        httpContext.Request.ContentType = "application/json";
        httpContext.Request.Body = new MemoryStream(
            Encoding.UTF8.GetBytes("""{"_tenantId":"tenant-from-body","_endpoint":"orders","id":42}"""));

        var proxyRequest = await ErpProxyRequestBuilder.BuildAsync(
            httpContext.Request,
            "tenant-from-route",
            "customers",
            CancellationToken.None);

        Assert.Equal("tenant-from-body", proxyRequest.TenantId);
        Assert.Equal("orders", proxyRequest.Endpoint);
        Assert.IsType<JsonObject>(proxyRequest.Body);
        Assert.Equal("""{"id":42}""", proxyRequest.Body!.ToJsonString());
    }
}
