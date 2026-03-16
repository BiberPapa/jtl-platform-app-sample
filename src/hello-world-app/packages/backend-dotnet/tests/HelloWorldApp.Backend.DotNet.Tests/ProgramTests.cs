using System.Net;
using System.Text;
using System.Text.Json.Nodes;
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

        var response = await client.PostAsync("/connect-tenant", content: null);

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
        client.DefaultRequestHeaders.Add("X-Session-Token", "session-token");

        var response = await client.PostAsync("/connect-tenant", content: null);
        var responseText = await response.Content.ReadAsStringAsync();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("""{"message":"Tenant connected successfully."}""", responseText);
    }

    [Fact]
    public async Task ErpInfo_RequiresSessionTokenHeader()
    {
        await using var factory = CreateFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/erp/customers");

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task ErpInfo_UsesValidatedTenantAndReturnsSuccessPayload()
    {
        var erpApiClient = new CapturingErpApiClient
        {
            ResponseFactory = _ => new HttpResponseMessage(HttpStatusCode.Created)
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

        using var request = new HttpRequestMessage(HttpMethod.Post, "/erp/customers/orders")
        {
            Content = new StringContent("""{"id":7}""", Encoding.UTF8, "application/json"),
        };
        request.Headers.Add("X-Session-Token", "session-token");

        var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(erpApiClient.LastRequest);
        Assert.Equal("platform-tenant-id", erpApiClient.LastTenantId);
        Assert.Equal("session-token", erpApiClient.LastSessionToken);
        Assert.Equal("customers/orders", erpApiClient.LastRequest!.Endpoint);
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
        client.DefaultRequestHeaders.Add("X-Session-Token", "session-token");

        var response = await client.GetAsync("/erp/customers");

        Assert.Equal(HttpStatusCode.BadGateway, response.StatusCode);
        Assert.Equal("downstream failed", await response.Content.ReadAsStringAsync());
    }

    [Fact]
    public async Task ErpInfo_RewritesForwardedOpenApiDocument()
    {
        var erpApiClient = new CapturingErpApiClient
        {
            ResponseFactory = _ => new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """
                    {
                      "openapi": "3.0.0",
                      "paths": {
                        "/customers": {
                          "get": {
                            "parameters": [
                              { "name": "X-Tenant-ID", "in": "header" }
                            ]
                          }
                        }
                      },
                      "components": {
                        "securitySchemes": {
                          "bearerAuth": { "type": "http", "scheme": "bearer" }
                        }
                      }
                    }
                    """,
                    Encoding.UTF8,
                    "application/json"),
            },
        };
        await using var factory = CreateFactory(services =>
        {
            services.RemoveAll<IErpApiClient>();
            services.AddSingleton<IErpApiClient>(erpApiClient);
        });
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add("X-Session-Token", "session-token");

        var response = await client.GetAsync("/erp/openapi.json");
        var payload = JsonNode.Parse(await response.Content.ReadAsStringAsync())!.AsObject();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(payload["paths"]!["/erp/customers"]);
        Assert.Equal(
            "X-Session-Token",
            payload["components"]!["securitySchemes"]!["SessionTokenHeader"]!["name"]!.GetValue<string>());
        Assert.Empty(payload["paths"]!["/erp/customers"]!["get"]!["parameters"]!.AsArray());
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
        public string? LastTenantId { get; private set; }
        public string? LastSessionToken { get; private set; }

        public Task<HttpResponseMessage> ForwardAsync(
            ErpProxyRequest request,
            string tenantId,
            string sessionToken,
            string method,
            CancellationToken cancellationToken)
        {
            LastRequest = request;
            LastTenantId = tenantId;
            LastSessionToken = sessionToken;
            return Task.FromResult(ResponseFactory(request));
        }
    }
}
