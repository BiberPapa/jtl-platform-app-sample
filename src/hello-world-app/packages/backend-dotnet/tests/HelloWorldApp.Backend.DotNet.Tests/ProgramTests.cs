using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using HelloWorldApp.Backend.DotNet.Models;
using HelloWorldApp.Backend.DotNet.Services;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;

namespace HelloWorldApp.Backend.DotNet.Tests;

public sealed class ProgramTests
{
    [Fact]
    public async Task RootEndpoint_ReturnsExpectedMessage()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Hello from TypeScript + Express!", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ConnectTenant_ReturnsBadRequestForMissingSessionToken()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/connect-tenant",
            new StringContent("{}", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ConnectTenant_ReturnsSuccessMessageForValidSessionToken()
    {
        var authService = new FakeAuthService();
        await using var factory = CreateFactory(services =>
        {
            services.RemoveAll<IJtlAuthService>();
            services.AddSingleton<IJtlAuthService>(authService);
        });
        var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/connect-tenant",
            new StringContent("""{"sessionToken":"session-token"}""", Encoding.UTF8, "application/json"));
        var responseText = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains("the JTL Platform tenant ID is platform-tenant-id", responseText, StringComparison.Ordinal);
    }

    [Fact]
    public async Task ErpInfo_ForwardsBodyOverridesAndReturnsSuccessPayload()
    {
        var erpApiClient = new CapturingErpApiClient
        {
            ResponseFactory = _ => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent("""{"result":"ok"}""", Encoding.UTF8, "application/json"),
            },
        };
        await using var factory = CreateFactory(services =>
        {
            services.RemoveAll<IErpApiClient>();
            services.AddSingleton<IErpApiClient>(erpApiClient);
        });
        var client = factory.CreateClient();

        var response = await client.PostAsync(
            "/erp-info/route-tenant/customers",
            new StringContent("""{"_tenantId":"body-tenant","_endpoint":"orders","id":7}""", Encoding.UTF8, "application/json"));

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(erpApiClient.LastRequest);
        Assert.Equal("body-tenant", erpApiClient.LastRequest!.TenantId);
        Assert.Equal("orders", erpApiClient.LastRequest.Endpoint);
        Assert.Equal("""{"id":7}""", erpApiClient.LastRequest.Body!.ToJsonString());
    }

    [Fact]
    public async Task ErpInfo_ReturnsDownstreamStatusAndMessage()
    {
        var erpApiClient = new CapturingErpApiClient
        {
            ResponseFactory = _ => new HttpResponseMessage(HttpStatusCode.BadGateway)
            {
                Content = new StringContent("downstream failed", Encoding.UTF8, "text/plain"),
            },
        };
        await using var factory = CreateFactory(services =>
        {
            services.RemoveAll<IErpApiClient>();
            services.AddSingleton<IErpApiClient>(erpApiClient);
        });
        var client = factory.CreateClient();

        var response = await client.GetAsync("/erp-info/tenant-a/customers");

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        Assert.Equal("downstream failed", await response.Content.ReadAsStringAsync());
    }

    private static WebApplicationFactory<Program> CreateFactory(Action<IServiceCollection>? configureServices = null)
    {
        return new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<IJtlAuthService>();
                services.RemoveAll<IErpApiClient>();
                services.AddSingleton<IJtlAuthService>(new FakeAuthService());
                services.AddSingleton<IErpApiClient>(new CapturingErpApiClient());
                configureServices?.Invoke(services);
            });
        });
    }

    private sealed class FakeAuthService : IJtlAuthService
    {
        public Task<string> GetJwtAsync(CancellationToken cancellationToken)
        {
            return Task.FromResult("jwt-token");
        }

        public Task<SessionTokenPayload> VerifySessionTokenAsync(string sessionToken, CancellationToken cancellationToken)
        {
            return sessionToken == "session-token"
                ? Task.FromResult(new SessionTokenPayload("user-id", "platform-tenant-id"))
                : throw new InvalidOperationException("The session token could not be validated.");
        }
    }

    private sealed class CapturingErpApiClient : IErpApiClient
    {
        public Func<ErpProxyRequest, HttpResponseMessage> ResponseFactory { get; set; } = _ => new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("""{"result":"ok"}""", Encoding.UTF8, "application/json"),
        };

        public ErpProxyRequest? LastRequest { get; private set; }

        public Task<HttpResponseMessage> ForwardAsync(ErpProxyRequest request, string method, CancellationToken cancellationToken)
        {
            LastRequest = request;
            return Task.FromResult(ResponseFactory(request));
        }
    }
}
